/**
 * CSV analysis pipeline for upload-driven dashboard generation.
 *
 * Parses CSV text, classifies columns, recommends charts, generates insights,
 * and returns a DashboardSpec plus typed rows for persistence.
 */

import type { DashboardSpec, FieldType, LayoutItem, MetricDef, WidgetDef } from "@/types/spec";
import type { Insight } from "@/lib/ai/insightsEngine";
import { classifyAllColumns } from "./columnClassifier";
import { recommendCharts } from "./chartRecommender";
import { generateInsights } from "./insightsEngine";
import { formatCompact } from "@/lib/utils/formatters";

interface CsvAnalysisInput {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

interface CsvAnalysisResult {
  spec: DashboardSpec;
  typedRows: Record<string, unknown>[];
  insights: Insight[];
}

function toEntityName(projectName: string): string {
  const base = projectName.replace(/\.[^/.]+$/, "").trim() || "Records";
  const words = base
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

  const raw = words.join("") || "Record";
  if (raw.endsWith("s") && raw.length > 1) return raw.slice(0, -1);
  return raw;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim().replace(/^"|"$/g, ""));
  return cells;
}

function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  if (headers.length === 0 || headers.some((header) => header.length === 0)) {
    return { headers: [], rows: [] };
  }

  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });

    return row;
  });

  return { headers, rows };
}

function inferFieldType(role: string): FieldType {
  switch (role) {
    case "datetime":
      return "datetime";
    case "boolean":
      return "boolean";
    case "continuous":
      return "float";
    case "categorical":
      return "string";
    case "text":
      return "text";
    default:
      return "string";
  }
}

function coerceValue(value: string, type: FieldType): unknown {
  if (value.trim().length === 0) return null;

  if (type === "float") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (type === "boolean") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  if (type === "datetime") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString();
  }

  return value;
}

function safeMetricName(prefix: string, column: string): string {
  const normalized = column.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `${prefix}_${normalized || "value"}`;
}

function buildLayout(widgets: WidgetDef[]) {
  const items: LayoutItem[] = [];

  const kpiWidgets = widgets.filter((widget) => widget.type === "kpi");
  const chartWidgets = widgets.filter((widget) => widget.type === "chart");
  const tableWidgets = widgets.filter((widget) => widget.type === "table");

  kpiWidgets.forEach((widget, index) => {
    items.push({
      i: widget.id,
      x: (index % 3) * 4,
      y: Math.floor(index / 3) * 2,
      w: 4,
      h: 2,
    });
  });

  const kpiRows = Math.ceil(kpiWidgets.length / 3);
  let currentChartY = kpiRows * 2;
  let currentChartX = 0;

  for (const widget of chartWidgets) {
    const width = widget.chartType === "donut" ? 4 : 6;
    const height = 3;

    if (currentChartX + width > 12) {
      currentChartY += 3;
      currentChartX = 0;
    }

    items.push({
      i: widget.id,
      x: currentChartX,
      y: currentChartY,
      w: width,
      h: height,
    });

    currentChartX += width;
    if (currentChartX >= 12) {
      currentChartY += 3;
      currentChartX = 0;
    }
  }

  const tableStartY = chartWidgets.length > 0 ? currentChartY + (currentChartX > 0 ? 3 : 0) : currentChartY;

  tableWidgets.forEach((widget, index) => {
    items.push({
      i: widget.id,
      x: 0,
      y: tableStartY + index * 4,
      w: 12,
      h: 4,
    });
  });

  return { columns: 12, items };
}

function fallbackSpec(projectName: string): DashboardSpec {
  return {
    version: "1.0",
    app: {
      name: `${projectName || "Uploaded Data"} Dashboard`,
      description: "Fallback dashboard generated due to CSV analysis issue.",
    },
    auth: { enabled: true, roles: ["admin", "manager", "viewer"] },
    entities: [
      {
        name: "Record",
        label: "Record",
        fields: [{ name: "value", type: "string", required: false, label: "Value" }],
      },
    ],
    metrics: [
      {
        name: "record_count",
        label: "Record Count",
        entity: "Record",
        operation: "count",
      },
    ],
    widgets: [
      {
        id: "kpi_record_count",
        type: "kpi",
        title: "Record Count",
        metric: "record_count",
      },
    ],
    kpis: [{ title: "Record Count", value: "0", field: "count" }],
    insights: [],
    layout: { columns: 12, items: [{ i: "kpi_record_count", x: 0, y: 0, w: 6, h: 4 }] },
  };
}

export function analyzeCsvAndBuildSpec(csvText: string, projectName: string): DashboardSpec {
  try {
    const parsed = parseCsvText(csvText);
    if (parsed.rows.length === 0 || parsed.headers.length === 0) {
      return fallbackSpec(projectName);
    }

    const entityName = toEntityName(projectName);
    const columns = classifyAllColumns(parsed.rows);
    const charts = recommendCharts(columns, parsed.rows);
    const insights = generateInsights(columns, parsed.rows);

    const fields = parsed.headers.map((header) => {
      const column = columns.find((item) => item.name === header);
      const inferredType = inferFieldType(column?.role ?? "text");
      const required = parsed.rows.every((row) => (row[header] ?? "").trim().length > 0);

      return {
        name: header,
        type: inferredType,
        required,
        label: header,
      };
    });

    const continuousColumns = columns.filter((column) => column.role === "continuous");

    const metrics: MetricDef[] = [
      {
        name: safeMetricName(entityName.toLowerCase(), "count"),
        label: `${entityName} Count`,
        entity: entityName,
        operation: "count",
      },
      ...continuousColumns.flatMap((column) => {
        const metricBase = safeMetricName(entityName.toLowerCase(), column.name);
        return [
          {
            name: `${metricBase}_sum`,
            label: `Total ${column.name}`,
            entity: entityName,
            operation: "sum" as const,
            field: column.name,
          },
          {
            name: `${metricBase}_avg`,
            label: `Avg ${column.name}`,
            entity: entityName,
            operation: "avg" as const,
            field: column.name,
          },
        ];
      }),
    ];

    const chartWidgets: WidgetDef[] = charts.map((chart, index) => {
      const chartType = chart.type === "donut" ? "donut" : chart.type === "histogram" ? "histogram" : chart.type;
      return {
        id: `chart_${index + 1}`,
        type: "chart",
        title: chart.title,
        chartType,
        entity: entityName,
        metricX: chart.xColumn,
        metrics: chart.yColumn === "count" ? undefined : [chart.yColumn],
        description: chart.description,
        config: {
          xAxis: chart.xColumn,
          yAxis: chart.yColumn,
          aggregation: chart.aggregation,
          groupBy: chart.xColumn,
          settings: { source: "csv-analysis" },
        },
      };
    });

    const kpis = continuousColumns.map((column) => {
      const values = parsed.rows
        .map((row) => Number((row[column.name] ?? "").replace(/,/g, "")))
        .filter((value) => Number.isFinite(value));

      const avg = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      return {
        title: `Avg ${column.name}`,
        value: formatCompact(avg),
        field: column.name,
      };
    });

    const kpiWidgets: WidgetDef[] = kpis.map((kpi, index) => {
      const metricBase = safeMetricName(entityName.toLowerCase(), kpi.field);
      return {
        id: `kpi_${index + 1}`,
        type: "kpi",
        title: kpi.title,
        metric: `${metricBase}_avg`,
        entity: entityName,
        description: `Current average is ${kpi.value}`,
        config: {
          yAxis: kpi.field,
          aggregation: "avg",
        },
      };
    });

    const tableWidget: WidgetDef = {
      id: "table_1",
      type: "table",
      title: `${entityName} Data`,
      entity: entityName,
      description: "Raw imported records",
    };

    const widgets = [...kpiWidgets, ...chartWidgets, tableWidget];

    return {
      version: "1.0",
      app: {
        name: `${projectName || entityName} Dashboard`,
        description: "AI-generated dashboard based on uploaded CSV data.",
      },
      auth: { enabled: true, roles: ["admin", "manager", "viewer"] },
      entities: [
        {
          name: entityName,
          label: entityName,
          fields,
        },
      ],
      metrics,
      widgets,
      kpis,
      insights,
      layout: buildLayout(widgets),
    };
  } catch {
    return fallbackSpec(projectName);
  }
}

export async function analyzeCsvData(input: CsvAnalysisInput): Promise<CsvAnalysisResult> {
  const spec = analyzeCsvAndBuildSpec(
    [input.headers.join(","), ...input.rows.map((row) => input.headers.map((header) => row[header] ?? "").join(","))].join("\n"),
    input.fileName
  );

  const entity = spec.entities[0];
  const typedRows = input.rows.map((row) => {
    const typed: Record<string, unknown> = {};
    for (const field of entity?.fields ?? []) {
      typed[field.name] = coerceValue(row[field.name] ?? "", field.type);
    }
    return typed;
  });

  return {
    spec,
    typedRows,
    insights: spec.insights ?? [],
  };
}
