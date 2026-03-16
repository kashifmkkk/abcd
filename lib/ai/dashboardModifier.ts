import type { DashboardSpec, LayoutItem, WidgetDef, MetricDef } from "@/types/spec";

function cloneSpec(spec: DashboardSpec): DashboardSpec {
  return {
    ...spec,
    app: { ...spec.app },
    entities: spec.entities.map((entity) => ({
      ...entity,
      fields: entity.fields.map((field) => ({ ...field })),
    })),
    metrics: spec.metrics.map((metric) => ({ ...metric })),
    widgets: spec.widgets.map((widget) => ({ ...widget, metrics: widget.metrics ? [...widget.metrics] : undefined })),
    layout: {
      ...spec.layout,
      items: spec.layout.items.map((item) => ({ ...item })),
    },
  };
}

function ensureUniqueWidgetId(spec: DashboardSpec, base: string) {
  const normalized = base.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  const ids = new Set(spec.widgets.map((widget) => widget.id));
  let candidate = normalized;
  let index = 1;
  while (ids.has(candidate)) {
    candidate = `${normalized}_${index}`;
    index += 1;
  }
  return candidate;
}

function hasWidget(spec: DashboardSpec, predicate: (widget: WidgetDef) => boolean) {
  return spec.widgets.some(predicate);
}

function addLayoutItem(spec: DashboardSpec, widgetId: string, w: number, h: number) {
  const currentMaxY = spec.layout.items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  const item: LayoutItem = { i: widgetId, x: 0, y: currentMaxY, w, h };
  spec.layout.items.push(item);
}

function pickMetricByPrompt(spec: DashboardSpec, prompt: string): MetricDef | null {
  const lower = prompt.toLowerCase();

  const keywordMetric = spec.metrics.find((metric) => {
    const text = `${metric.name} ${metric.label ?? ""} ${metric.entity} ${metric.field ?? ""}`.toLowerCase();
    return (
      (lower.includes("revenue") && /(revenue|amount|sales|gmv)/.test(text)) ||
      (lower.includes("sales") && /(sales|orders|revenue|amount)/.test(text)) ||
      (lower.includes("stock") && /(stock|inventory|quantity)/.test(text)) ||
      (lower.includes("vendor") && /(vendor|supplier)/.test(text))
    );
  });

  if (keywordMetric) return keywordMetric;

  return spec.metrics[0] ?? null;
}

function pickEntityByPrompt(spec: DashboardSpec, prompt: string) {
  const lower = prompt.toLowerCase();

  const exactEntity = spec.entities.find((entity) => {
    const name = entity.name.toLowerCase();
    const label = (entity.label ?? "").toLowerCase();
    return lower.includes(name) || (label && lower.includes(label));
  });

  if (exactEntity) return exactEntity;

  if (lower.includes("product")) {
    return spec.entities.find((entity) => /product|inventory|item/.test(entity.name.toLowerCase())) ?? spec.entities[0];
  }

  if (lower.includes("customer")) {
    return spec.entities.find((entity) => /customer|user|client/.test(entity.name.toLowerCase())) ?? spec.entities[0];
  }

  if (lower.includes("order")) {
    return spec.entities.find((entity) => /order|rfq|quote/.test(entity.name.toLowerCase())) ?? spec.entities[0];
  }

  return spec.entities[0];
}

export interface ModifyResult {
  spec: DashboardSpec;
  changes: string[];
}

export async function modifyDashboardSpecWithPrompt(
  inputSpec: DashboardSpec,
  prompt: string
): Promise<ModifyResult> {
  const spec = cloneSpec(inputSpec);
  const lower = prompt.toLowerCase();
  const changes: string[] = [];

  const wantsKpi = /kpi|metric|number card|stat/.test(lower);
  const wantsChart = /chart|trend|graph|line|bar|area|pie/.test(lower);
  const wantsTable = /table|list|grid/.test(lower);

  if (!wantsKpi && !wantsChart && !wantsTable) {
    // fallback: infer from phrases like "add revenue" → KPI by default
    const metric = pickMetricByPrompt(spec, lower);
    if (metric) {
      const widgetId = ensureUniqueWidgetId(spec, `${metric.name}_kpi`);
      if (!hasWidget(spec, (w) => w.type === "kpi" && w.metric === metric.name)) {
        spec.widgets.push({
          id: widgetId,
          type: "kpi",
          title: metric.label ?? metric.name,
          metric: metric.name,
          description: "AI-added KPI",
        });
        addLayoutItem(spec, widgetId, 3, 3);
        changes.push(`Added KPI: ${metric.label ?? metric.name}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
    return { spec, changes };
  }

  if (wantsKpi) {
    const metric = pickMetricByPrompt(spec, lower);
    if (metric && !hasWidget(spec, (w) => w.type === "kpi" && w.metric === metric.name)) {
      const widgetId = ensureUniqueWidgetId(spec, `${metric.name}_kpi`);
      spec.widgets.push({
        id: widgetId,
        type: "kpi",
        title: metric.label ?? metric.name,
        metric: metric.name,
        description: "AI-added KPI",
      });
      addLayoutItem(spec, widgetId, 3, 3);
      changes.push(`Added KPI: ${metric.label ?? metric.name}`);
    }
  }

  if (wantsChart) {
    const metric = pickMetricByPrompt(spec, lower);
    const chartType: WidgetDef["chartType"] =
      lower.includes("pie") ? "pie" : lower.includes("bar") ? "bar" : "line";

    if (metric) {
      const widgetId = ensureUniqueWidgetId(spec, `${metric.name}_${chartType}`);
      const entity = spec.entities.find((e) => e.name === metric.entity);
      const metricField = metric.field ?? entity?.fields.find((f) => f.type === "integer" || f.type === "float")?.name;
      const xField = entity?.fields.find((f) => f.type === "datetime")?.name ?? entity?.fields[0]?.name ?? "label";

      const duplicate = hasWidget(
        spec,
        (w) => w.type === "chart" && w.metric === metric.name && w.chartType === chartType
      );

      if (!duplicate) {
        spec.widgets.push({
          id: widgetId,
          type: "chart",
          title: `${metric.label ?? metric.name} ${chartType === "line" ? "Trend" : "Overview"}`,
          chartType,
          metric: metric.name,
          entity: metric.entity,
          metricX: xField,
          metrics: metricField ? [metricField] : undefined,
          description: "AI-added chart",
        });
        addLayoutItem(spec, widgetId, chartType === "pie" ? 4 : 6, 5);
        changes.push(`Added ${chartType} chart for ${metric.label ?? metric.name}`);
      }
    }
  }

  if (wantsTable) {
    const entity = pickEntityByPrompt(spec, lower);
    if (entity && !hasWidget(spec, (w) => w.type === "table" && w.entity === entity.name)) {
      const widgetId = ensureUniqueWidgetId(spec, `${entity.name}_table`);
      spec.widgets.push({
        id: widgetId,
        type: "table",
        title: `${entity.label ?? entity.name} Table`,
        entity: entity.name,
        description: "AI-added table",
      });
      addLayoutItem(spec, widgetId, 12, 6);
      changes.push(`Added table for ${entity.label ?? entity.name}`);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 120));
  return { spec, changes };
}
