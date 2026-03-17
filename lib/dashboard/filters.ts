import { z } from "zod";
import type { DashboardFilterOptions, DashboardFilters } from "@/types/dashboard";

const FILTER_FIELDS = {
  category: ["category"],
  region: ["region"],
  status: ["status"],
} as const;

export const DashboardFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
});

export interface FilterableRow {
  data: Record<string, unknown>;
  createdAt?: Date | string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function findFieldValue(record: Record<string, unknown>, candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeValue(record[candidate]);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function resolveDateValue(row: FilterableRow): Date | null {
  const candidateKeys = Object.keys(row.data).filter((key) => /(date|time|at)$/i.test(key));

  for (const key of candidateKeys) {
    const raw = row.data[key];
    const parsed = new Date(String(raw));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (row.createdAt) {
    const parsed = new Date(row.createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function matchesDateRange(row: FilterableRow, filters: DashboardFilters): boolean {
  if (!filters.dateFrom && !filters.dateTo) {
    return true;
  }

  const recordDate = resolveDateValue(row);
  if (!recordDate) {
    return false;
  }

  const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const to = filters.dateTo ? new Date(filters.dateTo) : null;

  if (from && !Number.isNaN(from.getTime()) && recordDate < from) {
    return false;
  }

  if (to && !Number.isNaN(to.getTime())) {
    const inclusiveTo = new Date(to);
    inclusiveTo.setHours(23, 59, 59, 999);
    if (recordDate > inclusiveTo) {
      return false;
    }
  }

  return true;
}

function matchesFieldFilter(
  record: Record<string, unknown>,
  filterValue: string | undefined,
  candidates: readonly string[]
): boolean {
  if (!isNonEmptyString(filterValue)) {
    return true;
  }

  const recordValue = findFieldValue(record, candidates);
  return recordValue?.toLowerCase() === filterValue.toLowerCase();
}

export function parseDashboardFilters(input: URLSearchParams | Record<string, string | undefined>): DashboardFilters {
  const source = input instanceof URLSearchParams
    ? {
        dateFrom: input.get("dateFrom") ?? undefined,
        dateTo: input.get("dateTo") ?? undefined,
        category: input.get("category") ?? undefined,
        region: input.get("region") ?? undefined,
        status: input.get("status") ?? undefined,
      }
    : input;

  const parsed = DashboardFiltersSchema.safeParse(source);
  return parsed.success ? parsed.data : {};
}

export function applyDashboardFilters<T extends FilterableRow>(rows: T[], filters: DashboardFilters): T[] {
  return rows.filter((row) => {
    if (!matchesDateRange(row, filters)) return false;
    if (!matchesFieldFilter(row.data, filters.category, FILTER_FIELDS.category)) return false;
    if (!matchesFieldFilter(row.data, filters.region, FILTER_FIELDS.region)) return false;
    if (!matchesFieldFilter(row.data, filters.status, FILTER_FIELDS.status)) return false;
    return true;
  });
}

export function collectDashboardFilterOptions(rows: FilterableRow[]): DashboardFilterOptions {
  const categories = new Set<string>();
  const regions = new Set<string>();
  const statuses = new Set<string>();

  for (const row of rows) {
    const category = findFieldValue(row.data, FILTER_FIELDS.category);
    const region = findFieldValue(row.data, FILTER_FIELDS.region);
    const status = findFieldValue(row.data, FILTER_FIELDS.status);

    if (category) categories.add(category);
    if (region) regions.add(region);
    if (status) statuses.add(status);
  }

  return {
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    regions: Array.from(regions).sort((a, b) => a.localeCompare(b)),
    statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
  };
}

export function appendDashboardFilters(searchParams: URLSearchParams, filters: DashboardFilters) {
  for (const [key, value] of Object.entries(filters)) {
    if (isNonEmptyString(value)) {
      searchParams.set(key, value);
    }
  }
}