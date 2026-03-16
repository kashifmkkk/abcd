"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AnalyticsCard } from "@/components/widgets/AnalyticsCard";
import { scrollToSection } from "@/lib/utils/scrollToSection";

type ChartType = "bar" | "line" | "pie" | "area";

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

// Enterprise indigo-to-violet palette
const PALETTE = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
];

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "12px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
  background: "#fff",
};

const tickStyle = { fontSize: 11, fill: "#94a3b8" };
const gridStyle = { strokeDasharray: "3 3", stroke: "#f1f5f9" };

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadFromMetric() {
      if (!metric) return false;
      const res = await fetch(`/api/metrics/${projectId}?metric=${encodeURIComponent(metric)}`);
      if (!res.ok) return false;
      const json = (await res.json()) as { series?: Array<{ label: string; value: number }> };
      if (!cancelled) {
        setData((json.series ?? []).map((p) => ({ label: p.label, value: p.value })));
        setLoading(false);
      }
      return true;
    }

    async function loadFromEntityFields() {
      if (!entity || !fields.length || !xKey) return;
      const params = new URLSearchParams({ projectId, entity, metricX: xKey, fields: fields.join(",") });
      const res = await fetch(`/api/metrics?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { success?: boolean; data?: Record<string, unknown>[] };
      if (!cancelled && json.success && Array.isArray(json.data)) {
        setData(json.data);
        setLoading(false);
      }
    }

    async function load() {
      const done = await loadFromMetric();
      if (!done) await loadFromEntityFields();
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [projectId, metric, entity, xKey, fields, refreshKey]);

  const yFields = metric ? ["value"] : fields;
  const axisKey = metric ? "label" : xKey;

  const emptyState = (
    <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Database size={16} />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No data yet</p>
      <button
        type="button"
        onClick={() => {
          if (entity) {
            scrollToSection(`section-${entity}`);
            return;
          }
          scrollToSection("tables-section");
        }}
        className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
      >
        Add Data
      </button>
    </div>
  );

  const loadingSkeleton = (
    <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
  );

  function renderChart() {
    if (loading) return loadingSkeleton;
    if (data.length === 0) return emptyState;

    const height = 220;

    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey={axisKey} tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
            {yFields.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yFields.map((f, i) => (
              <Bar
                key={f}
                dataKey={f}
                fill={PALETTE[i % PALETTE.length]}
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={axisKey} tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={tooltipStyle} />
            {yFields.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yFields.map((f, i) => (
              <Line
                key={f}
                type="monotone"
                dataKey={f}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              {yFields.map((f, i) => (
                <linearGradient key={f} id={`grad-${f}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={axisKey} tick={tickStyle} tickLine={false} axisLine={false} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={tooltipStyle} />
            {yFields.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yFields.map((f, i) => (
              <Area
                key={f}
                type="monotone"
                dataKey={f}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                fill={`url(#grad-${f})`}
                dot={false}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // Pie chart
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie
            data={data}
            nameKey={axisKey}
            dataKey={yFields[0]}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={45}
            paddingAngle={3}
            isAnimationActive
            animationDuration={600}
            label={({ value }) => value}
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <AnalyticsCard title={title}>
      {renderChart()}
    </AnalyticsCard>
  );
}
