/**
 * Column classifier for CSV datasets.
 *
 * Infers semantic column roles using header patterns and value distribution,
 * so downstream charting and insights avoid ID/text misuse as metrics.
 */

export type ColumnRole = 'id' | 'categorical' | 'continuous' | 'datetime' | 'text' | 'boolean';

export interface ClassifiedColumn {
  name: string;
  role: ColumnRole;
  uniqueCount: number;
  sample: string[];
}

function normalizeValues(values: string[]): string[] {
  return values
    .map((value) => (value ?? '').trim())
    .filter((value) => value.length > 0);
}

function isNumericValue(value: string): boolean {
  if (value.trim().length === 0) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

function isBooleanValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'true' ||
    normalized === 'false' ||
    normalized === 'yes' ||
    normalized === 'no' ||
    normalized === '1' ||
    normalized === '0'
  );
}

function isDateLike(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) return false;
  if (/^\d+$/.test(normalized)) return false;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(normalized)) return true;
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(normalized)) return true;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed);
}

function uniqueRatio(values: string[]): number {
  if (values.length === 0) return 0;
  const uniqueCount = new Set(values).size;
  return uniqueCount / values.length;
}

export function classifyColumn(name: string, values: string[]): ColumnRole {
  const normalizedName = name.trim();
  const nonEmpty = normalizeValues(values);

  if (/\bid\b|_id$|^id/i.test(normalizedName)) {
    return 'id';
  }

  if (/email|phone|url|name|address/i.test(normalizedName)) {
    return 'text';
  }

  if (/date|time|year|month|joining|created|updated/i.test(normalizedName)) {
    return 'datetime';
  }

  if (nonEmpty.length === 0) {
    return 'text';
  }

  const allDate = nonEmpty.every((value) => isDateLike(value));
  if (allDate) {
    return 'datetime';
  }

  const allBoolean = nonEmpty.every((value) => isBooleanValue(value));
  const normalizedBooleanValues = nonEmpty.map((value) => {
    const token = value.toLowerCase();
    if (token === 'true' || token === 'yes' || token === '1') return 'true';
    return 'false';
  });
  const booleanUniqueCount = new Set(normalizedBooleanValues).size;
  if (allBoolean && booleanUniqueCount <= 2) {
    return 'boolean';
  }

  const allNumeric = nonEmpty.every((value) => isNumericValue(value));
  const ratio = uniqueRatio(nonEmpty);
  const uniqueCount = new Set(nonEmpty).size;

  if (allNumeric && ratio > 0.7) {
    return 'continuous';
  }

  if (uniqueCount < 15 || ratio < 0.2) {
    return 'categorical';
  }

  return 'text';
}

export function classifyAllColumns(rows: Record<string, string>[]): ClassifiedColumn[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const columnNames = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columnNames.add(key);
    }
  }

  const columns: ClassifiedColumn[] = [];
  for (const columnName of columnNames) {
    const values = rows.map((row) => {
      const value = row[columnName];
      return typeof value === 'string' ? value : '';
    });

    const nonEmpty = normalizeValues(values);
    const unique = Array.from(new Set(nonEmpty));
    const sample = unique.slice(0, 5);

    columns.push({
      name: columnName,
      role: classifyColumn(columnName, values),
      uniqueCount: unique.length,
      sample,
    });
  }

  return columns;
}
