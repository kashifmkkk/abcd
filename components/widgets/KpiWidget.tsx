  "use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface KpiWidgetProps {
  projectId: string;
  title: string;
  metric: string;
  refreshKey?: number;
}

export function KpiWidget({ projectId, title, metric, refreshKey = 0 }: KpiWidgetProps) {
  const [value, setValue] = useState<number | string | null>(null);
  const [prevValue, setPrevValue] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const res = await fetch(`/api/metrics/${projectId}?metric=${encodeURIComponent(metric)}`, {
        cache: "no-store",
      });
      if (!res.ok) { setLoading(false); return; }
      const json = (await res.json()) as { value?: number | string };
      if (!cancelled) {
        setPrevValue((p) => p);
        setValue(json.value ?? 0);
        setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, metric, refreshKey]);

  // Derive trend direction vs previous value
  const numVal = typeof value === "number" ? value : Number(value);
  const numPrev = typeof prevValue === "number" ? prevValue : Number(prevValue);
  const hasTrend = !isNaN(numVal) && !isNaN(numPrev) && numPrev !== 0 && numPrev !== numVal;
  const trendPct = hasTrend ? Math.round(((numVal - numPrev) / Math.abs(numPrev)) * 100) : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug">{title}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <TrendingUp size={15} />
        </span>
      </div>

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value ?? "—"}
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
          {metric}
        </p>
      )}
    </div>
  );
}
