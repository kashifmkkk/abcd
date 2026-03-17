"use client";

import { useEffect, useState } from "react";
import { Lightbulb, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { appendDashboardFilters } from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/types/dashboard";
import type { Insight, InsightType } from "@/types/insights";

interface InsightsPanelProps {
  projectId: string;
  filters?: DashboardFilters;
  refreshKey?: number;
}

const iconMap: Record<InsightType, typeof TrendingUp> = {
  trend: TrendingUp,
  top_value: Trophy,
  outlier: AlertTriangle,
};

const colorMap: Record<InsightType, { bg: string; text: string; border: string }> = {
  trend: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  top_value: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  outlier: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
  },
};

const labelMap: Record<InsightType, string> = {
  trend: "Trend",
  top_value: "Top Value",
  outlier: "Anomaly",
};

export function InsightsPanel({ projectId, filters = {}, refreshKey = 0 }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const params = new URLSearchParams();
      appendDashboardFilters(params, filters);

      const res = await fetch(`/api/insights/${projectId}?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok || cancelled) {
        setLoading(false);
        return;
      }

      const json = (await res.json()) as { success: boolean; data: Insight[] };
      if (!cancelled && json.success) {
        setInsights(json.data);
      }
      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, filters, refreshKey]);

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Lightbulb size={16} />
          AI Insights
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      </section>
    );
  }

  if (insights.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Lightbulb size={16} className="text-amber-500" />
        AI Insights
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => {
          const colors = colorMap[insight.type];
          const Icon = iconMap[insight.type];
          const label = labelMap[insight.type];

          return (
            <div
              key={`${insight.type}-${insight.field}-${index}`}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-shadow hover:shadow-md`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                  <Icon size={14} />
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                  {label}
                </span>
              </div>
              <p className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
