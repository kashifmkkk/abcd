"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WidgetDef } from "@/types/spec";

export interface DashboardMetricsMap {
  [metricName: string]: {
    value: number | string;
    series: Array<{ label: string; x: string; value: number }>;
  };
}

export interface DashboardEntityPreviewsMap {
  [entityName: string]: {
    total: number;
    records: Array<{ id: string; data: Record<string, unknown>; createdAt: string; updatedAt: string }>;
  };
}

interface DashboardApiResponse {
  success: boolean;
  data?: {
    widgets: WidgetDef[];
    computedMetrics: DashboardMetricsMap;
    entityPreviews: DashboardEntityPreviewsMap;
  };
}

export function useDashboardData(projectId: string) {
  const [widgets, setWidgets] = useState<WidgetDef[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetricsMap>({});
  const [entityPreviews, setEntityPreviews] = useState<DashboardEntityPreviewsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/${projectId}`, { cache: "no-store" });
      const json = (await res.json()) as DashboardApiResponse;

      if (!res.ok || !json.success || !json.data) {
        setError("Failed to load dashboard data");
        return;
      }

      setWidgets(json.data.widgets);
      setMetrics(json.data.computedMetrics);
      setEntityPreviews(json.data.entityPreviews);
      setError(null);
      setTick((prev) => prev + 1);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      if (cancelled) return;
      await fetchDashboardData();
    }

    void loadInitial();

    const interval = setInterval(() => {
      void fetchDashboardData();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  return useMemo(
    () => ({
      widgets,
      metrics,
      entityPreviews,
      loading,
      error,
      refresh: fetchDashboardData,
      tick,
    }),
    [widgets, metrics, entityPreviews, loading, error, fetchDashboardData, tick]
  );
}
