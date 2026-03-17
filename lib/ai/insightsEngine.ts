/**
 * AI Insights Engine.
 *
 * Analyses entity records in-memory and produces human-readable insights:
 *   - Trend detection   (MoM / period-over-period % change)
 *   - Top values         (highest value for a numeric field)
 *   - Outlier detection  (values beyond 2 standard deviations)
 *
 * No external API calls — pure computation over the dataset.
 */

import type { Insight } from "@/types/insights";
import type { DashboardSpec, EntityDef, FieldDef } from "@/types/spec";

// ─── helpers ──────────────────────────────────────────────────────────────────

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(month) - 1]} ${year}`;
}

function numericFields(entity: EntityDef): FieldDef[] {
  return entity.fields.filter((f) => f.type === "integer" || f.type === "float");
}

function dateFields(entity: EntityDef): FieldDef[] {
  return entity.fields.filter((f) => f.type === "datetime");
}

function stringFields(entity: EntityDef): FieldDef[] {
  return entity.fields.filter((f) => f.type === "string");
}

function pickDateField(entity: EntityDef): FieldDef | undefined {
  const preferred = entity.fields.find(
    (f) => f.type === "datetime" && /(date|time|created|at)/i.test(f.name),
  );
  return preferred ?? dateFields(entity)[0];
}

function pickLabelField(entity: EntityDef): FieldDef | undefined {
  const preferred = entity.fields.find(
    (f) => f.type === "string" && /(name|title|label|product|customer|item)/i.test(f.name),
  );
  return preferred ?? stringFields(entity)[0];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${Math.round(pct)}%`;
}

// ─── trend detection ──────────────────────────────────────────────────────────

function detectTrends(
  entity: EntityDef,
  records: Array<Record<string, unknown>>,
): Insight[] {
  const insights: Insight[] = [];
  const dateField = pickDateField(entity);
  if (!dateField) return insights;

  for (const numField of numericFields(entity)) {
    // Group by month
    const buckets = new Map<string, number[]>();
    for (const row of records) {
      const d = toDate(row[dateField.name]);
      if (!d) continue;
      const key = toMonthKey(d);
      const arr = buckets.get(key) ?? [];
      arr.push(toNumber(row[numField.name]));
      buckets.set(key, arr);
    }

    const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (sorted.length < 2) continue;

    const [prevKey, prevValues] = sorted[sorted.length - 2];
    const [currKey, currValues] = sorted[sorted.length - 1];
    const prevSum = prevValues.reduce((a, b) => a + b, 0);
    const currSum = currValues.reduce((a, b) => a + b, 0);

    if (prevSum === 0) continue;

    const pctChange = ((currSum - prevSum) / Math.abs(prevSum)) * 100;
    if (Math.abs(pctChange) < 1) continue;

    const direction = pctChange > 0 ? "increased" : "decreased";
    const label = numField.label ?? numField.name;
    insights.push({
      type: "trend",
      message: `${label} ${direction} ${formatPct(Math.abs(pctChange))} MoM (${monthLabel(prevKey)} → ${monthLabel(currKey)})`,
      field: numField.name,
      entity: entity.name,
    });
  }

  return insights;
}

// ─── top values ───────────────────────────────────────────────────────────────

function detectTopValues(
  entity: EntityDef,
  records: Array<Record<string, unknown>>,
): Insight[] {
  const insights: Insight[] = [];
  const labelField = pickLabelField(entity);

  for (const numField of numericFields(entity)) {
    if (labelField) {
      // Aggregate by label and find top entry
      const agg = new Map<string, number>();
      for (const row of records) {
        const label = String(row[labelField.name] ?? "Unknown");
        agg.set(label, (agg.get(label) ?? 0) + toNumber(row[numField.name]));
      }
      if (agg.size === 0) continue;

      const sorted = [...agg.entries()].sort((a, b) => b[1] - a[1]);
      const [topLabel, topValue] = sorted[0];
      const fieldLabel = numField.label ?? numField.name;
      insights.push({
        type: "top_value",
        message: `Top ${labelField.label ?? labelField.name} by ${fieldLabel}: ${topLabel} (${formatNumber(topValue)})`,
        field: numField.name,
        entity: entity.name,
      });
    } else {
      // No label field — just report the max value
      let max = -Infinity;
      for (const row of records) {
        const v = toNumber(row[numField.name]);
        if (v > max) max = v;
      }
      if (!Number.isFinite(max)) continue;

      const fieldLabel = numField.label ?? numField.name;
      insights.push({
        type: "top_value",
        message: `Highest ${fieldLabel}: ${formatNumber(max)}`,
        field: numField.name,
        entity: entity.name,
      });
    }
  }

  return insights;
}

// ─── outlier detection ────────────────────────────────────────────────────────

function detectOutliers(
  entity: EntityDef,
  records: Array<Record<string, unknown>>,
): Insight[] {
  const insights: Insight[] = [];
  const dateField = pickDateField(entity);

  for (const numField of numericFields(entity)) {
    const values = records.map((r) => toNumber(r[numField.name]));
    if (values.length < 5) continue;

    const avg = mean(values);
    const sd = stddev(values);
    if (sd === 0) continue;

    const threshold = 2;

    for (let i = 0; i < records.length; i++) {
      const v = values[i];
      const zScore = Math.abs((v - avg) / sd);
      if (zScore < threshold) continue;

      // Build a date label if possible
      let dateLabel = "";
      if (dateField) {
        const d = toDate(records[i][dateField.name]);
        if (d) {
          dateLabel = ` on ${d.toISOString().slice(0, 10)}`;
        }
      }

      const fieldLabel = numField.label ?? numField.name;
      const direction = v > avg ? "spike" : "drop";
      insights.push({
        type: "outlier",
        message: `Anomaly detected: ${fieldLabel} ${direction} to ${formatNumber(v)}${dateLabel} (${formatPct(((v - avg) / Math.abs(avg)) * 100)} from mean)`,
        field: numField.name,
        entity: entity.name,
      });

      // Only report the most extreme outlier per field
      break;
    }
  }

  return insights;
}

// ─── public API ───────────────────────────────────────────────────────────────

export interface DatasetInput {
  entity: EntityDef;
  records: Array<Record<string, unknown>>;
}

/**
 * Generate data-driven insights for one or more entity datasets.
 *
 * @param datasets - Array of entity + records pairs
 * @returns Array of human-readable insight objects
 */
export function generateInsights(datasets: DatasetInput[]): Insight[] {
  const all: Insight[] = [];

  for (const { entity, records } of datasets) {
    if (records.length === 0) continue;
    all.push(...detectTrends(entity, records));
    all.push(...detectTopValues(entity, records));
    all.push(...detectOutliers(entity, records));
  }

  return all;
}

/**
 * Convenience wrapper: derive datasets from a DashboardSpec + row map.
 */
export function generateInsightsFromSpec(
  spec: DashboardSpec,
  entityRows: Record<string, Array<Record<string, unknown>>>,
): Insight[] {
  const datasets: DatasetInput[] = spec.entities
    .filter((e) => (entityRows[e.name]?.length ?? 0) > 0)
    .map((e) => ({ entity: e, records: entityRows[e.name] }));

  return generateInsights(datasets);
}
