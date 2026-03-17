/**
 * Core TypeScript type definitions for the Dashboard Spec structure.
 * The spec JSON is stored in Project.specJson (JSONB column) and drives
 * all dynamic rendering, CRUD, and metric computation.
 */

/** Supported field data types */
export type FieldType =
  | "string"
  | "text"
  | "integer"
  | "float"
  | "boolean"
  | "datetime";

/** A single field definition within an entity */
export interface FieldDef {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  label?: string;
}

/** An entity (table-like structure) in the dashboard spec */
export interface EntityDef {
  name: string;
  label?: string;
  fields: FieldDef[];
}

/** Supported metric aggregation operations */
export type MetricOperation = "count" | "sum" | "avg" | "min" | "max";

/** A metric derived from an entity field */
export interface MetricDef {
  name: string;
  label?: string;
  entity: string;
  operation: MetricOperation;
  field?: string; // optional for "count"
  filter?: Record<string, unknown>;
}

/** Supported chart types */
export type ChartType = "bar" | "line" | "pie" | "area";

/** Supported widget types */
export type WidgetType = "kpi" | "chart" | "table";

/** A widget definition that renders on the dashboard */
export interface WidgetConfigDef {
  xAxis?: string;
  yAxis?: string;
  aggregation?: MetricOperation;
  groupBy?: string;
  settings?: Record<string, unknown>;
}

export interface WidgetDef {
  id: string;
  type: WidgetType;
  title: string;
  /** For kpi widgets */
  metric?: string;
  /** For chart widgets */
  chartType?: ChartType;
  metricX?: string; // x-axis metric/field label
  metrics?: string[]; // metrics to plot
  /** For table widgets */
  entity?: string;
  /** Optional description */
  description?: string;
  /** User-configurable widget settings */
  config?: WidgetConfigDef;
}

/** A single layout item compatible with react-grid-layout */
export interface LayoutItem {
  i: string;  // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/** Layout configuration */
export interface LayoutDef {
  columns: number;
  items: LayoutItem[];
}

/** Auth configuration block */
export interface AuthDef {
  enabled: boolean;
  roles?: string[];
}

/** Top-level dashboard specification */
export interface DashboardSpec {
  version: "1.0";
  app: {
    name: string;
    description?: string;
  };
  auth?: AuthDef;
  entities: EntityDef[];
  metrics: MetricDef[];
  widgets: WidgetDef[];
  layout: LayoutDef;
}

export type Spec = DashboardSpec;
export type Entity = EntityDef;
export type Field = FieldDef;
export type Metric = MetricDef;
export type Widget = WidgetDef;
export type Layout = LayoutDef;
