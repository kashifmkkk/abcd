"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiWidgetProps {
  projectId: string;
  title: string;
  metric: string;
  refreshKey?: number;
}

export function KpiWidget({ projectId, title, metric, refreshKey = 0 }: KpiWidgetProps) {
  const [value, setValue] = useState<number | string>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/metrics/${projectId}?metric=${encodeURIComponent(metric)}`);
      if (!res.ok) return;

      const json = (await res.json()) as { value?: number | string };
      if (!cancelled) {
        setValue(json.value ?? 0);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, metric, refreshKey]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
