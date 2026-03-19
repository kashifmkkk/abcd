"use client";

/**
 * Reusable empty/loading/error states for dashboard chart widgets.
 */

import { AlertCircle, BarChart2 } from "lucide-react";

interface EmptyChartStateProps {
  title?: string;
  reason?: "no-data" | "loading" | "error";
}

export function EmptyChartState({ title, reason = "no-data" }: EmptyChartStateProps) {
  if (reason === "loading") {
    return (
      <div className="flex h-full w-full items-end justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="h-20 w-10 animate-pulse rounded-md bg-indigo-200 dark:bg-indigo-900/60" />
        <div className="h-32 w-10 animate-pulse rounded-md bg-indigo-300 dark:bg-indigo-800/60" />
        <div className="h-24 w-10 animate-pulse rounded-md bg-indigo-200 dark:bg-indigo-900/60" />
      </div>
    );
  }

  if (reason === "error") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 p-6 text-center dark:border-rose-900/70 dark:bg-rose-950/20">
        <AlertCircle className="mb-3 h-8 w-8 text-rose-500" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Chart could not load</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try refreshing or check your data</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-800 dark:bg-slate-900/60">
      <BarChart2 className="mb-3 h-8 w-8 text-indigo-500" />
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No data available yet</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Upload a CSV or add records to see this chart
      </p>
      {title ? <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{title}</p> : null}
    </div>
  );
}
