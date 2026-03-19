/**
 * Chart recommendation engine.
 *
 * Produces meaningful chart specs from classified columns and raw rows,
 * prioritizing temporal trends and avoiding ID/text misuse in visuals.
 */

import type { ClassifiedColumn } from '@/lib/ai/columnClassifier';

export interface ChartSpec {
  type: 'bar' | 'line' | 'area' | 'donut' | 'histogram' | 'scatter';
  title: string;
  xColumn: string;
  yColumn: string;
  aggregation: 'sum' | 'avg' | 'count';
  description: string;
  score?: number;
}

function hasUsableData(rows: Record<string, string>[], xColumn: string, yColumn: string): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  for (const row of rows) {
    const xValue = row[xColumn];
    const yValue = row[yColumn];
    if (typeof xValue === 'string' && xValue.trim().length > 0 && typeof yValue === 'string' && yValue.trim().length > 0) {
      return true;
    }
  }

  return false;
}

function hasColumnData(rows: Record<string, string>[], column: string): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return false;

  for (const row of rows) {
    const value = row[column];
    if (typeof value === 'string' && value.trim().length > 0) {
      return true;
    }
  }

  return false;
}

function byName(a: ClassifiedColumn, b: ClassifiedColumn): number {
  return a.name.localeCompare(b.name);
}

export function recommendCharts(columns: ClassifiedColumn[], rows: Record<string, string>[]): ChartSpec[] {
  if (!Array.isArray(columns) || columns.length === 0 || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const usable = columns.filter((column) => column.role !== 'id' && column.role !== 'text');
  const categorical = usable.filter((column) => column.role === 'categorical').sort(byName);
  const continuous = usable.filter((column) => column.role === 'continuous').sort(byName);
  const datetime = usable.filter((column) => column.role === 'datetime').sort(byName);

  const areaCharts: ChartSpec[] = [];
  const barCharts: ChartSpec[] = [];
  const donutCharts: ChartSpec[] = [];
  const histogramCharts: ChartSpec[] = [];
  const barPerYColumnCount = new Map<string, number>();
  const barXColumns = new Set<string>();

  for (const dateColumn of datetime) {
    for (const numericColumn of continuous) {
      if (!hasUsableData(rows, dateColumn.name, numericColumn.name)) continue;

      areaCharts.push({
        type: 'area',
        title: numericColumn.name + ' Trend over ' + dateColumn.name,
        xColumn: dateColumn.name,
        yColumn: numericColumn.name,
        aggregation: 'avg',
        description: 'Temporal trend of ' + numericColumn.name + ' aggregated by ' + dateColumn.name + '.',
        score: 100,
      });
    }
  }

  for (const categoryColumn of categorical) {
    for (const numericColumn of continuous) {
      if (!hasUsableData(rows, categoryColumn.name, numericColumn.name)) continue;

      const currentCount = barPerYColumnCount.get(numericColumn.name) ?? 0;
      if (currentCount >= 2) continue;

      const categoryValues = rows
        .map((row) => (row[categoryColumn.name] ?? '').trim())
        .filter((value) => value.length > 0);
      const uniqueCategoryCount = new Set(categoryValues).size;

      const scoreByName = /(salary|revenue|amount)/i.test(numericColumn.name) ? 90 : 80;
      const scoreByCardinality = uniqueCategoryCount > 100 ? 50 : scoreByName;

      barCharts.push({
        type: 'bar',
        title: 'Avg ' + numericColumn.name + ' by ' + categoryColumn.name,
        xColumn: categoryColumn.name,
        yColumn: numericColumn.name,
        aggregation: 'avg',
        description: 'Compares average ' + numericColumn.name + ' across ' + categoryColumn.name + ' groups.',
        score: scoreByCardinality,
      });

      barPerYColumnCount.set(numericColumn.name, currentCount + 1);
      barXColumns.add(categoryColumn.name);
    }
  }

  for (const categoryColumn of categorical) {
    if (categoryColumn.uniqueCount >= 8) continue;
    if (!hasColumnData(rows, categoryColumn.name)) continue;
    if (barXColumns.has(categoryColumn.name)) continue;

    donutCharts.push({
      type: 'donut',
      title: categoryColumn.name + ' Distribution',
      xColumn: categoryColumn.name,
      yColumn: 'count',
      aggregation: 'count',
      description: 'Shows proportional distribution of ' + categoryColumn.name + ' values.',
      score: 70,
    });
  }

  for (const numericColumn of continuous) {
    if (!hasColumnData(rows, numericColumn.name)) continue;

    histogramCharts.push({
      type: 'histogram',
      title: numericColumn.name + ' Distribution',
      xColumn: numericColumn.name,
      yColumn: numericColumn.name,
      aggregation: 'count',
      description: 'Distribution profile for ' + numericColumn.name + '.',
      score: 40,
    });
  }

  const prioritized = areaCharts
    .concat(barCharts, donutCharts, histogramCharts)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  if (prioritized.length <= 6) return prioritized;
  return prioritized.slice(0, 6);
}
