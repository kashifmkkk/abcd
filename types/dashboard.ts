import type { LayoutDef, MetricOperation, WidgetDef } from "@/types/spec";

export type WidgetVisualization = "line" | "bar" | "area" | "pie" | "donut" | "histogram" | "table" | "metric";

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  region?: string;
  status?: string;
}

export interface DashboardFilterOptions {
  categories: string[];
  regions: string[];
  statuses: string[];
}

export interface DashboardWidgetConfig {
  xAxis?: string;
  yAxis?: string;
  aggregation?: MetricOperation;
  groupBy?: string;
  settings?: Record<string, unknown>;
}

export interface DashboardWidgetModel extends WidgetDef {
  config?: DashboardWidgetConfig;
}

export interface DashboardCustomizationState {
  widgets: DashboardWidgetModel[];
  layout: LayoutDef;
  filterOptions: DashboardFilterOptions;
}

export interface DashboardSaveInput {
  widgets: DashboardWidgetModel[];
  layout: LayoutDef;
}