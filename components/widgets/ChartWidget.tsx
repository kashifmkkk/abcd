"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartType = "bar" | "line" | "pie";

interface ChartWidgetProps {
  projectId: string;
  title: string;
  chartType: ChartType;
  metric?: string;
  entity?: string;
  xKey?: string;
  fields?: string[];
  refreshKey?: number;
}

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

export function ChartWidget({
  projectId,
  title,
  chartType,
  metric,
  entity,
  xKey = "label",
  fields = ["value"],
  refreshKey = 0,
}: ChartWidgetProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFromMetric() {
      if (!metric) return false;

      const res = await fetch(`/api/metrics/${projectId}?metric=${encodeURIComponent(metric)}`);
      if (!res.ok) return false;

      const json = (await res.json()) as { series?: Array<{ label: string; value: number }> };
      if (!cancelled) {
        setData((json.series ?? []).map((point) => ({ label: point.label, value: point.value })));
      }
      return true;
    }

    async function loadFromEntityFields() {
      if (!entity || !fields.length || !xKey) return;

      const params = new URLSearchParams({
        projectId,
        entity,
        metricX: xKey,
        fields: fields.join(","),
      });

      const res = await fetch(`/api/metrics?${params.toString()}`);
      if (!res.ok) return;

      const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown>[] };
      if (!cancelled && json.success && Array.isArray(json.data)) {
        setData(json.data);
      }
    }

    async function load() {
      const loadedMetric = await loadFromMetric();
      if (!loadedMetric) {
        await loadFromEntityFields();
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, metric, entity, xKey, fields, refreshKey]);

  const yFields = metric ? ["value"] : fields;
  const axisKey = metric ? "label" : xKey;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-64px)] overflow-hidden">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No chart data yet. Add records in the related table.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={axisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {yFields.map((f, idx) => (
                  <Bar key={f} dataKey={f} fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={axisKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {yFields.map((f, idx) => (
                  <Line key={f} type="monotone" dataKey={f} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            ) : (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={data}
                  nameKey={axisKey}
                  dataKey={yFields[0]}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
