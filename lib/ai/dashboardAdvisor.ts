import type { DashboardSpec } from "@/types/spec";

export interface DashboardSuggestion {
  suggestion: string;
}

const ADVISOR_SYSTEM_PROMPT =
  "You are a business analytics expert. Suggest improvements for this dashboard spec.";

function hasWidgetWithMetric(spec: DashboardSpec, metricName: string) {
  return spec.widgets.some((widget) => widget.metric === metricName);
}

function pickFirstNumericField(spec: DashboardSpec) {
  for (const entity of spec.entities) {
    const numeric = entity.fields.find((field) => field.type === "integer" || field.type === "float");
    if (numeric) {
      return { entity: entity.name, field: numeric.name };
    }
  }
  return null;
}

export async function analyzeDashboard(spec: DashboardSpec): Promise<DashboardSuggestion[]> {
  const suggestions: DashboardSuggestion[] = [];

  if (!spec.metrics.some((metric) => metric.name.includes("conversion"))) {
    suggestions.push({ suggestion: "Add conversion rate KPI" });
  }

  if (!spec.widgets.some((widget) => widget.type === "chart" && widget.chartType === "pie")) {
    suggestions.push({ suggestion: "Add pie chart for order status" });
  }

  const revenueMetric = spec.metrics.find((metric) => /revenue|amount|sales/i.test(metric.name));
  if (revenueMetric && !hasWidgetWithMetric(spec, revenueMetric.name)) {
    suggestions.push({ suggestion: "Add revenue growth chart" });
  }

  if (!revenueMetric) {
    const fallback = pickFirstNumericField(spec);
    if (fallback) {
      suggestions.push({ suggestion: `Add trend chart for ${fallback.field}` });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({ suggestion: "Add an executive summary KPI section" });
  }

  await new Promise((resolve) => setTimeout(resolve, 120));

  void ADVISOR_SYSTEM_PROMPT;
  return suggestions.slice(0, 4);
}
