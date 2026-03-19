"use client";

/**
 * Donut chart widget for categorical frequency distribution.
 */

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { EmptyChartState } from "@/components/dashboard/widgets/EmptyChartState";

interface DonutChartWidgetProps {
  title: string;
  data: Record<string, string>[];
  dimension: string;
  showTitle?: boolean;
}

interface PiePoint {
  name: string;
  value: number;
}

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export function DonutChartWidget({ title, data, dimension, showTitle = true }: DonutChartWidgetProps) {
  const chartData = useMemo<PiePoint[]>(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const counts = new Map<string, number>();
    for (const row of data) {
      const key = (row[dimension] ?? "").trim() || "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, dimension]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return <EmptyChartState title={title} reason="no-data" />;
  }

  return (
    <div className="flex h-full flex-col">
      {showTitle ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ background: "transparent" }}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              const ratio = total > 0 ? numeric / total : 0;
              return [`${formatNumber(numeric)} (${formatPercent(ratio)})`, String(name ?? "")];
            }}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
            )}
          />
          <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-700 text-sm font-semibold">
            {formatNumber(total)}
          </text>
          <text x="50%" y="51%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-xs">
            Total
          </text>
        </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
