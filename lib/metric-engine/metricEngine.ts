/**
 * Metric Engine.
 *
 * Computes aggregated metric values from entity records stored in DashboardData.
 * Supports: count, sum, avg, min, max.
 *
 * All computation is done in JavaScript (no raw SQL) so it works with
 * any Prisma/PostgreSQL setup without database-specific functions.
 * For large datasets, replace with a GROUP BY / aggregate query.
 */
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import type { DashboardSpec, MetricDef } from "@/types/spec";
import type { MetricResult } from "@/types/api";

function toNumeric(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isDateLike(value: unknown): boolean {
  if (value == null) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  const parsed = new Date(String(value));
  return !Number.isNaN(parsed.getTime());
}

function normalizeToMonth(value: unknown): string {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
}

function pickDateField(records: Array<Record<string, unknown>>, preferred?: string): string | null {
  if (records.length === 0) return null;

  if (preferred) {
    const preferredMatches = records.filter((record) => isDateLike(record[preferred])).length;
    if (preferredMatches / records.length >= 0.6) return preferred;
  }

  const keys = Object.keys(records[0] ?? {});
  const rankedKeys = keys.sort((a, b) => {
    const aScore = /(date|time|at)$/i.test(a) ? 1 : 0;
    const bScore = /(date|time|at)$/i.test(b) ? 1 : 0;
    return bScore - aScore;
  });

  for (const key of rankedKeys) {
    const matches = records.filter((record) => isDateLike(record[key])).length;
    if (matches / records.length >= 0.6) return key;
  }

  return null;
}

export function computeMetricFromRecords(
  metric: MetricDef,
  records: Array<Record<string, unknown>>
): number {
  switch (metric.operation) {
    case "count":
      return records.length;

    case "sum":
      return records.reduce((sum, record) => sum + toNumeric(record[metric.field!]), 0);

    case "avg":
      if (records.length === 0) return 0;
      return records.reduce((sum, record) => sum + toNumeric(record[metric.field!]), 0) / records.length;

    case "min":
      if (records.length === 0) return 0;
      return Math.min(...records.map((record) => toNumeric(record[metric.field!])));

    case "max":
      if (records.length === 0) return 0;
      return Math.max(...records.map((record) => toNumeric(record[metric.field!])));

    default:
      return 0;
  }
}

function normalizeDateLabel(value: unknown): string {
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return "unknown";
}

async function getMetricByName(projectId: string, metricName: string, spec?: DashboardSpec): Promise<MetricDef | null> {
  if (spec) {
    return spec.metrics.find((m) => m.name === metricName) ?? null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { specJson: true },
  });

  if (!project) return null;

  let parsedSpec: DashboardSpec;
  try {
    parsedSpec = validateSpec(project.specJson);
  } catch {
    return null;
  }

  return parsedSpec.metrics.find((m) => m.name === metricName) ?? null;
}

// ─── Single metric computation ────────────────────────────────────────────────

/**
 * Compute a single metric for a project.
 * Loads all entity records and performs in-memory aggregation.
 */
export async function computeMetric(
  projectId: string,
  metric: MetricDef | string,
  spec?: DashboardSpec
): Promise<MetricResult> {
  const metricDef =
    typeof metric === "string"
      ? await getMetricByName(projectId, metric, spec)
      : metric;

  if (!metricDef) {
    return {
      name: typeof metric === "string" ? metric : metric.name,
      value: 0,
    };
  }

  const rows: Array<{ data: unknown }> = await prisma.dashboardData.findMany({
    where: { projectId, entity: metricDef.entity },
    select: { data: true },
  });

  // Extract raw JSON data blobs
  const records = rows.map((row: { data: unknown }) => row.data as Record<string, unknown>);

  const value = computeMetricFromRecords(metricDef, records);

  return {
    name: metricDef.name,
    value: Number.isFinite(value) ? Math.round(value * 100) / 100 : 0,
  };
}

export async function computeMetricSeries(
  projectId: string,
  metric: MetricDef | string,
  spec?: DashboardSpec
) {
  const metricDef =
    typeof metric === "string"
      ? await getMetricByName(projectId, metric, spec)
      : metric;

  if (!metricDef) return [];

  const rows = await prisma.dashboardData.findMany({
    where: { projectId, entity: metricDef.entity },
    select: { data: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, { sum: number; count: number; min: number; max: number }> = {};

  for (const row of rows) {
    const record = row.data as Record<string, unknown>;
    const rawDate = record.createdAt ?? record.date ?? row.createdAt;
    const label = normalizeDateLabel(rawDate);

    if (!grouped[label]) {
      grouped[label] = {
        sum: 0,
        count: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      };
    }

    const bucket = grouped[label];

    if (metricDef.operation === "count") {
      bucket.count += 1;
      continue;
    }

    const value = metricDef.field ? toNumeric(record[metricDef.field]) : 0;
    bucket.sum += value;
    bucket.count += 1;
    bucket.min = Math.min(bucket.min, value);
    bucket.max = Math.max(bucket.max, value);
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, bucket]) => {
      let value = 0;
      switch (metricDef.operation) {
        case "count":
          value = bucket.count;
          break;
        case "sum":
          value = bucket.sum;
          break;
        case "avg":
          value = bucket.count === 0 ? 0 : bucket.sum / bucket.count;
          break;
        case "min":
          value = bucket.count === 0 ? 0 : bucket.min;
          break;
        case "max":
          value = bucket.count === 0 ? 0 : bucket.max;
          break;
        default:
          value = 0;
      }

      return {
      label,
      x: label,
      value: Math.round(value * 100) / 100,
      };
    });
}

// ─── Bulk metric computation ──────────────────────────────────────────────────

/**
 * Compute ALL metrics defined in the spec for a project.
 * Returns a map of metricName → MetricResult.
 */
export async function computeAllMetrics(
  projectId: string,
  spec: DashboardSpec
): Promise<Record<string, MetricResult>> {
  const results = await Promise.all(
    spec.metrics.map((metric) => computeMetric(projectId, metric))
  );

  return Object.fromEntries(results.map((r) => [r.name, r]));
}

/**
 * Compute chart data for a widget: return an array of objects with
 * the x-axis field and the requested metric fields per record.
 *
 * E.g. for entity=Product, metricX=name, metrics=[stock,price]
 * returns [{ name: "Widget A", stock: 100, price: 9.99 }, ...]
 */
export async function computeChartData(
  projectId: string,
  entityName: string,
  metricX: string,
  fields: string[]
): Promise<Record<string, unknown>[]> {
  const rows: Array<{ data: unknown }> = await prisma.dashboardData.findMany({
    where: { projectId, entity: entityName },
    select: { data: true },
    orderBy: { createdAt: "asc" },
  });

  const rawRecords = rows.map((record: { data: unknown }) => record.data as Record<string, unknown>);
  const dateField = pickDateField(rawRecords, metricX);

  if (dateField) {
    const grouped = new Map<string, Record<string, unknown>>();

    for (const row of rawRecords) {
      const label = normalizeToMonth(row[dateField]);
      const current = grouped.get(label) ?? { label };

      for (const f of fields) {
        const base = Number(current[f] ?? 0);
        current[f] = base + toNumeric(row[f]);
      }

      grouped.set(label, current);
    }

    const output = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    if (fields.length > 0) {
      return output.map((row) => ({
        ...row,
        value: Number(row[fields[0]] ?? 0),
      }));
    }

    return output;
  }

  return rawRecords.map((row) => {
    const point: Record<string, unknown> = { label: row[metricX] ?? "" };
    for (const f of fields) {
      point[f] = toNumeric(row[f]);
    }
    if (fields.length > 0) point.value = Number(point[fields[0]] ?? 0);
    return point;
  });
}
