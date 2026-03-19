/**
 * Insights engine for classified CSV datasets.
 *
 * Generates human-readable insights from continuous, categorical, and datetime
 * columns while explicitly skipping ID/text columns.
 */

import type { ClassifiedColumn } from "./columnClassifier";
import type { ChartSpec } from "./chartRecommender";
import { formatCompact, formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";

export interface Insight {
  type: "trend" | "top_value" | "distribution" | "outlier";
  title: string;
  description: string;
  severity: "info" | "warning" | "positive";
}

function toFiniteNumber(value: string | undefined): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, n) => sum + (n - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function toMonthKey(input: string): string | null {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function maybeCurrencyLabel(columnName: string, value: number): string {
  if (/(salary|revenue|income|cost|price|amount|budget|profit)/i.test(columnName)) {
    return formatCurrency(value);
  }
  return formatCompact(value);
}

export function generateInsights(
  columns: ClassifiedColumn[],
  rows: Record<string, string>[]
): Insight[] {
  if (!Array.isArray(columns) || columns.length === 0 || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const continuousColumns = columns.filter((c) => c.role === "continuous");
  const categoricalColumns = columns.filter((c) => c.role === "categorical");
  const datetimeColumns = columns.filter((c) => c.role === "datetime");

  const topValueInsights: Insight[] = [];
  const distributionInsights: Insight[] = [];
  const trendInsights: Insight[] = [];
  const outlierInsights: Insight[] = [];

  for (const column of continuousColumns) {
    const values = rows
      .map((row) => toFiniteNumber(row[column.name]))
      .filter((value): value is number => value !== null);

    if (values.length === 0) continue;

    const avg = mean(values);
    const med = median(values);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const deviation = stdDev(values);

    topValueInsights.push({
      type: "top_value",
      title: `${column.name} Summary`,
      description:
        `Average ${column.name} is ${maybeCurrencyLabel(column.name, avg)} across ${formatNumber(values.length)} records ` +
        `(median ${maybeCurrencyLabel(column.name, med)}, min ${maybeCurrencyLabel(column.name, min)}, max ${maybeCurrencyLabel(column.name, max)}).`,
      severity: "info",
    });

    if (deviation > 0) {
      const threshold = avg + deviation * 2;
      const outlierCount = values.filter((value) => value > threshold).length;
      if (outlierCount > 0) {
        const ratio = outlierCount / values.length;
        outlierInsights.push({
          type: "outlier",
          title: `${column.name} Outliers`,
          description:
            `${formatNumber(outlierCount)} records in ${column.name} are above ${maybeCurrencyLabel(column.name, threshold)} ` +
            `(${formatPercent(ratio)} of the dataset).`,
          severity: ratio > 0.1 ? "warning" : "info",
        });
      }
    }
  }

  for (const column of categoricalColumns) {
    const cleanedValues = rows
      .map((row) => (row[column.name] ?? "").trim())
      .filter((value) => value.length > 0);

    if (cleanedValues.length === 0) continue;

    const frequency = new Map<string, number>();
    for (const value of cleanedValues) {
      frequency.set(value, (frequency.get(value) ?? 0) + 1);
    }

    const sorted = [...frequency.entries()].sort((a, b) => b[1] - a[1]);
    const [topValue, topCount] = sorted[0];
    const total = cleanedValues.length;
    const share = total > 0 ? topCount / total : 0;

    distributionInsights.push({
      type: "distribution",
      title: `${column.name} Distribution`,
      description:
        `${topValue} is the most common ${column.name} value with ${formatNumber(topCount)} records ` +
        `(${formatPercent(share)} of ${formatNumber(total)} total).`,
      severity: share >= 0.5 ? "warning" : "positive",
    });
  }

  const trendChartPairs: ChartSpec[] = [];
  for (const dateColumn of datetimeColumns) {
    for (const valueColumn of continuousColumns) {
      trendChartPairs.push({
        type: "area",
        title: `${valueColumn.name} Trend over ${dateColumn.name}`,
        xColumn: dateColumn.name,
        yColumn: valueColumn.name,
        aggregation: "avg",
        description: "Auto-generated trend pair for insight computation.",
      });
    }
  }

  for (const pair of trendChartPairs) {
    const monthly = new Map<string, { sum: number; count: number }>();

    for (const row of rows) {
      const monthKey = toMonthKey((row[pair.xColumn] ?? "").trim());
      const numeric = toFiniteNumber(row[pair.yColumn]);
      if (!monthKey || numeric === null) continue;

      const current = monthly.get(monthKey) ?? { sum: 0, count: 0 };
      current.sum += numeric;
      current.count += 1;
      monthly.set(monthKey, current);
    }

    const sorted = [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({ key, avg: bucket.count > 0 ? bucket.sum / bucket.count : 0 }));

    if (sorted.length < 2) continue;

    const prev = sorted[sorted.length - 2];
    const current = sorted[sorted.length - 1];
    if (!Number.isFinite(prev.avg) || Math.abs(prev.avg) < Number.EPSILON) continue;

    const delta = current.avg - prev.avg;
    const changeRatio = delta / Math.abs(prev.avg);
    if (!Number.isFinite(changeRatio) || Math.abs(changeRatio) < 0.01) continue;

    trendInsights.push({
      type: "trend",
      title: `${pair.yColumn} Monthly Trend`,
      description:
        `${pair.yColumn} ${delta >= 0 ? "increased" : "decreased"} by ${formatPercent(Math.abs(changeRatio))} ` +
        `from ${toMonthLabel(prev.key)} to ${toMonthLabel(current.key)}.`,
      severity: delta >= 0 ? "positive" : "warning",
    });
  }

  const prioritized = [...topValueInsights, ...distributionInsights, ...trendInsights, ...outlierInsights];
  return prioritized.slice(0, 6);
}
