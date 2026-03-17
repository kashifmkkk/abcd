import type { DashboardSpec, FieldType, MetricDef, WidgetDef } from "@/types/spec";

interface CsvAnalysisInput {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

interface CsvAnalysisResult {
  spec: DashboardSpec;
  typedRows: Record<string, unknown>[];
}

function toEntityName(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, "").trim() || "records";
  const words = base
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

  const raw = words.join("") || "Record";
  if (raw.endsWith("s") && raw.length > 1) return raw.slice(0, -1);
  return raw;
}

function isBooleanValue(value: string) {
  const normalized = value.toLowerCase();
  return ["true", "false", "yes", "no", "0", "1"].includes(normalized);
}

function isDateLike(value: string) {
  if (!value) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return true;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function inferFieldType(values: string[]): FieldType {
  const nonEmpty = values.filter((value) => value !== "");
  if (nonEmpty.length === 0) return "string";

  const allBoolean = nonEmpty.every((value) => isBooleanValue(value));
  if (allBoolean) return "boolean";

  const allNumeric = nonEmpty.every((value) => Number.isFinite(Number(value)));
  if (allNumeric) {
    const allInteger = nonEmpty.every((value) => Number.isInteger(Number(value)));
    return allInteger ? "integer" : "float";
  }

  const allDate = nonEmpty.every((value) => isDateLike(value));
  if (allDate) return "datetime";

  const longText = nonEmpty.some((value) => value.length > 120);
  return longText ? "text" : "string";
}

function coerceValue(value: string, type: FieldType): unknown {
  if (value === "") return null;

  switch (type) {
    case "integer":
      return Number.parseInt(value, 10);
    case "float":
      return Number.parseFloat(value);
    case "boolean": {
      const normalized = value.toLowerCase();
      return normalized === "true" || normalized === "yes" || normalized === "1";
    }
    case "datetime": {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toISOString();
    }
    default:
      return value;
  }
}

function pickPrimaryNumericField(
  fields: Array<{ name: string; type: FieldType }>
): { name: string; type: FieldType } | null {
  const priorityRegex = /(amount|price|revenue|total|cost|value|score)/i;
  const numeric = fields.filter((field) => field.type === "integer" || field.type === "float");
  if (numeric.length === 0) return null;

  const preferred = numeric.find((field) => priorityRegex.test(field.name));
  return preferred ?? numeric[0];
}

function pickDateField(fields: Array<{ name: string; type: FieldType }>) {
  const preferred = fields.find((field) => /created|date|time|at/i.test(field.name));
  if (preferred && preferred.type === "datetime") return preferred.name;

  const firstDate = fields.find((field) => field.type === "datetime");
  return firstDate?.name;
}

function buildMetrics(entityName: string, fields: Array<{ name: string; type: FieldType }>): MetricDef[] {
  const metrics: MetricDef[] = [
    {
      name: `${entityName.toLowerCase()}_count`,
      label: `${entityName} Count`,
      entity: entityName,
      operation: "count",
    },
  ];

  const numeric = pickPrimaryNumericField(fields);
  if (numeric) {
    metrics.push(
      {
        name: `total_${numeric.name.toLowerCase()}`,
        label: `Total ${numeric.name}`,
        entity: entityName,
        operation: "sum",
        field: numeric.name,
      },
      {
        name: `avg_${numeric.name.toLowerCase()}`,
        label: `Avg ${numeric.name}`,
        entity: entityName,
        operation: "avg",
        field: numeric.name,
      }
    );
  }

  return metrics;
}

function buildWidgets(
  entityName: string,
  metrics: MetricDef[],
  dateField: string | undefined,
  numericField: string | undefined
): WidgetDef[] {
  const widgets: WidgetDef[] = [];

  const countMetric = metrics.find((metric) => metric.operation === "count");
  const sumMetric = metrics.find((metric) => metric.operation === "sum");

  if (countMetric) {
    widgets.push({
      id: "kpi_count",
      type: "kpi",
      title: countMetric.label ?? "Total Records",
      metric: countMetric.name,
    });
  }

  if (sumMetric) {
    widgets.push({
      id: "kpi_sum",
      type: "kpi",
      title: sumMetric.label ?? "Total Value",
      metric: sumMetric.name,
    });
  }

  const trendMetric = sumMetric ?? countMetric;
  if (trendMetric) {
    widgets.push({
      id: "trend_chart",
      type: "chart",
      title: `${trendMetric.label ?? trendMetric.name} Trend`,
      chartType: "line",
      metric: trendMetric.name,
      entity: entityName,
      metricX: dateField ?? "createdAt",
      metrics: numericField ? [numericField] : undefined,
    });
  }

  if (countMetric) {
    widgets.push({
      id: "distribution_chart",
      type: "chart",
      title: `${countMetric.label ?? "Record Count"} Distribution`,
      chartType: "bar",
      metric: countMetric.name,
      entity: entityName,
      metricX: dateField ?? "createdAt",
      metrics: numericField ? [numericField] : undefined,
    });
  }

  widgets.push({
    id: "data_table",
    type: "table",
    title: `${entityName} Data`,
    entity: entityName,
  });

  return widgets;
}

function buildLayout(widgetIds: string[]) {
  const items = widgetIds.map((id, index) => {
    if (id === "data_table") {
      return { i: id, x: 0, y: 8, w: 12, h: 8 };
    }

    if (index < 2) {
      return { i: id, x: index * 6, y: 0, w: 6, h: 3 };
    }

    return { i: id, x: ((index - 2) % 2) * 6, y: 3 + Math.floor((index - 2) / 2) * 5, w: 6, h: 5 };
  });

  return {
    columns: 12,
    items,
  };
}

export async function analyzeCsvData(input: CsvAnalysisInput): Promise<CsvAnalysisResult> {
  const entityName = toEntityName(input.fileName);

  // Sample up to 200 rows for type inference to avoid scanning the entire dataset
  const sampleSize = Math.min(input.rows.length, 200);
  const sampleRows = input.rows.length <= sampleSize
    ? input.rows
    : input.rows.filter((_, i) => i % Math.ceil(input.rows.length / sampleSize) === 0).slice(0, sampleSize);

  const inferredFields = input.headers.map((header) => {
    const values = sampleRows.map((row) => row[header] ?? "");
    const type = inferFieldType(values);
    const required = values.every((value) => value !== "");

    return {
      name: header,
      type,
      required,
      label: header,
    };
  });

  const typedRows = input.rows.map((row) => {
    const typed: Record<string, unknown> = {};
    for (const field of inferredFields) {
      typed[field.name] = coerceValue(row[field.name] ?? "", field.type);
    }
    return typed;
  });

  const metrics = buildMetrics(entityName, inferredFields);
  const numeric = pickPrimaryNumericField(inferredFields);
  const dateField = pickDateField(inferredFields);
  const widgets = buildWidgets(entityName, metrics, dateField, numeric?.name);

  const spec: DashboardSpec = {
    version: "1.0",
    app: {
      name: `${entityName} Dashboard`,
      description: `AI-generated dashboard from uploaded CSV: ${input.fileName}`,
    },
    auth: {
      enabled: true,
      roles: ["admin", "manager", "viewer"],
    },
    entities: [
      {
        name: entityName,
        label: entityName,
        fields: inferredFields,
      },
    ],
    metrics,
    widgets,
    layout: buildLayout(widgets.map((widget) => widget.id)),
  };

  await new Promise((resolve) => setTimeout(resolve, 150));

  return { spec, typedRows };
}
