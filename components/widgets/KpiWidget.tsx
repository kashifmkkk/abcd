  "use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { appendDashboardFilters } from "@/lib/dashboard/filters";
import { formatCompact } from "@/lib/utils/formatters";
import type { DashboardFilters } from "@/types/dashboard";
import type { MetricOperation } from "@/types/spec";

interface KpiWidgetProps {
  projectId: string;
  title: string;
  metric?: string;
  entity?: string;
  field?: string;
  aggregation?: MetricOperation;
  groupBy?: string;
  filters?: DashboardFilters;
  refreshKey?: number;
}

export function KpiWidget({
  projectId,
  title,
  metric,
  entity,
  field,
  aggregation,
  groupBy,
  filters = {},
  refreshKey = 0,
}: KpiWidgetProps) {
  const [value, setValue] = useState<number | string | null>(null);
  const [prevValue, setPrevValue] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      queueMicrotask(() => {
        if (!cancelled) {
          setLoading(true);
        }
      });

      const params = new URLSearchParams();
      if (metric) {
        params.set("metric", metric);
      } else if (entity && aggregation) {
        params.set("entity", entity);
        params.set("aggregation", aggregation);
        if (field) params.set("field", field);
        if (groupBy) params.set("groupBy", groupBy);
      } else {
        if (!cancelled) {
          setValue(null);
          setHasData(false);
          setLoading(false);
        }
        return;
      }

      appendDashboardFilters(params, filters);

      const res = await fetch(`/api/metrics/${projectId}?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) { setLoading(false); return; }
      const json = (await res.json()) as { value?: number | string; hasData?: boolean };
      if (!cancelled) {
        setPrevValue((p) => p);
        setValue(json.value ?? 0);
        setHasData(json.hasData ?? true);
        setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, metric, entity, field, aggregation, groupBy, filters, refreshKey]);

  // Derive trend direction vs previous value
  const numVal = typeof value === "number" ? value : Number(value);
  const numPrev = typeof prevValue === "number" ? prevValue : Number(prevValue);
  const hasTrend = !isNaN(numVal) && !isNaN(numPrev) && numPrev !== 0 && numPrev !== numVal;
  const trendPct = hasTrend ? Math.round(((numVal - numPrev) / Math.abs(numPrev)) * 100) : null;
  const displayValue = typeof value === "number"
    ? formatCompact(value)
    : value == null
      ? "—"
      : value;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug">{title}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <TrendingUp size={15} />
        </span>
      </div>

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        ) : !hasData ? (
          <p className="max-w-[16rem] text-sm text-slate-500 dark:text-slate-400">
            No data available for current filters.
          </p>
        ) : (
          <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {displayValue}
          </p>
        )}
      </div>

      {trendPct !== null ? (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              trendPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trendPct >= 0 ? "↑" : "↓"} {Math.abs(trendPct)}%
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">vs previous</span>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {metric ?? `${aggregation ?? "count"} ${field ?? "records"}`}
        </p>
      )}
    </div>
  );
}
