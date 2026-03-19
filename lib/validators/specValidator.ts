/**
 * Zod validation schema for DashboardSpec.
 * Used before saving a spec to the database and when loading specs.
 */
import { z } from "zod";
import type { DashboardSpec, FieldType } from "@/types/spec";

// ─── Field ────────────────────────────────────────────────────────────────────

const FieldTypeSchema = z.enum([
  "string",
  "text",
  "integer",
  "float",
  "boolean",
  "datetime",
]);

const FieldDefSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  type: FieldTypeSchema,
  required: z.boolean().optional().default(false),
  default: z.unknown().optional(),
  label: z.string().optional(),
});

// ─── Entity ───────────────────────────────────────────────────────────────────

const EntityDefSchema = z.object({
  name: z.string().min(1, "Entity name is required"),
  label: z.string().optional(),
  fields: z.array(FieldDefSchema).min(1, "At least one field is required"),
});

// ─── Metric ───────────────────────────────────────────────────────────────────

const MetricOperationSchema = z.enum(["count", "sum", "avg", "min", "max"]);

const MetricDefSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().optional(),
    entity: z.string().min(1),
    operation: MetricOperationSchema,
    field: z.string().optional(),
    filter: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (m) => m.operation === "count" || !!m.field,
    "field is required for sum/avg/min/max metrics"
  );

// ─── Widget ───────────────────────────────────────────────────────────────────

const ChartTypeSchema = z.enum(["bar", "line", "pie", "area", "donut", "histogram", "scatter"]);
const WidgetTypeSchema = z.enum(["kpi", "chart", "table"]);

const WidgetDefSchema = z.object({
  id: z.string().min(1),
  type: WidgetTypeSchema,
  title: z.string().min(1),
  metric: z.string().optional(),
  chartType: ChartTypeSchema.optional(),
  metricX: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  entity: z.string().optional(),
  description: z.string().optional(),
  config: z.object({
    xAxis: z.string().optional(),
    yAxis: z.string().optional(),
    aggregation: MetricOperationSchema.optional(),
    groupBy: z.string().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

// ─── Layout ───────────────────────────────────────────────────────────────────

const LayoutItemSchema = z.object({
  i: z.string(),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  minW: z.number().optional(),
  minH: z.number().optional(),
});

const LayoutDefSchema = z.object({
  columns: z.number().int().positive().default(12),
  items: z.array(LayoutItemSchema).default([]),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

const AuthDefSchema = z.object({
  enabled: z.boolean(),
  roles: z.array(z.string()).optional(),
});

// ─── Root Spec ────────────────────────────────────────────────────────────────

export const DashboardSpecSchema = z.object({
  version: z.literal("1.0"),
  app: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
  auth: AuthDefSchema.optional(),
  entities: z.array(EntityDefSchema).min(1, "At least one entity is required"),
  metrics: z.array(MetricDefSchema),
  widgets: z.array(WidgetDefSchema),
  kpis: z.array(z.object({
    title: z.string(),
    value: z.string(),
    field: z.string(),
  })).optional(),
  insights: z.array(z.object({
    type: z.enum(["trend", "top_value", "distribution", "outlier"]),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["info", "warning", "positive"]),
  })).optional(),
  layout: LayoutDefSchema,
}).superRefine((spec, ctx) => {
  const entityNames = new Set<string>();
  const metricNames = new Set<string>();

  for (let i = 0; i < spec.entities.length; i += 1) {
    const entity = spec.entities[i];
    const entityKey = entity.name.toLowerCase();

    if (entityNames.has(entityKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entities", i, "name"],
        message: `Duplicate entity name: ${entity.name}`,
      });
    }
    entityNames.add(entityKey);

    const fieldNames = new Set<string>();
    for (let j = 0; j < entity.fields.length; j += 1) {
      const field = entity.fields[j];
      const fieldKey = field.name.toLowerCase();

      if (fieldNames.has(fieldKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entities", i, "fields", j, "name"],
          message: `Duplicate field name \"${field.name}\" in entity \"${entity.name}\"`,
        });
      }
      fieldNames.add(fieldKey);
    }
  }

  for (let i = 0; i < spec.metrics.length; i += 1) {
    const metric = spec.metrics[i];
    if (metricNames.has(metric.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metrics", i, "name"],
        message: `Duplicate metric name: ${metric.name}`,
      });
    }
    metricNames.add(metric.name);

    const entity = spec.entities.find((e) => e.name.toLowerCase() === metric.entity.toLowerCase());
    if (!entity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metrics", i, "entity"],
        message: `Metric \"${metric.name}\" references missing entity \"${metric.entity}\"`,
      });
      continue;
    }

    if (metric.operation !== "count") {
      const fieldExists = entity.fields.some((f) => f.name === metric.field);
      if (!fieldExists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metrics", i, "field"],
          message: `Metric \"${metric.name}\" references missing field \"${metric.field}\" in entity \"${entity.name}\"`,
        });
      }
    }
  }

  for (let i = 0; i < spec.widgets.length; i += 1) {
    const widget = spec.widgets[i];
    if (widget.metric && !metricNames.has(widget.metric)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["widgets", i, "metric"],
        message: `Widget \"${widget.id}\" references missing metric \"${widget.metric}\"`,
      });
    }
  }
});

export type ValidatedSpec = z.infer<typeof DashboardSpecSchema>;

/** Validate a raw object as a DashboardSpec. Returns parsed spec or throws. */
export function validateSpec(spec: unknown): ValidatedSpec {
  return DashboardSpecSchema.parse(spec);
}

/** Safe version — returns success/error */
export function safeValidateSpec(raw: unknown) {
  return DashboardSpecSchema.safeParse(raw);
}

export const SupportedFieldTypes: FieldType[] = [
  "string",
  "text",
  "integer",
  "float",
  "boolean",
  "datetime",
];

export type DashboardSpecInput = DashboardSpec;
