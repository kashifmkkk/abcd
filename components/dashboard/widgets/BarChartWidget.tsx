"use client";

/**
 * Bar chart widget with pre-aggregation for categorical and histogram-like data.
 */

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatNumber } from "@/lib/utils/formatters";
import { EmptyChartState } from "@/components/dashboard/widgets/EmptyChartState";

interface BarChartWidgetProps {
  title: string;
  data: Record<string, string>[];
  xColumn: string;
  yColumn: string;
  aggregation: "sum" | "avg" | "count";
  showTitle?: boolean;
}

interface AggregatedPoint {
  label: string;
  value: number;
}

export function BarChartWidget({ title, data, xColumn, yColumn, aggregation, showTitle = true }: BarChartWidgetProps) {
  const aggregatedData = useMemo<AggregatedPoint[]>(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const groups = new Map<string, { sum: number; count: number }>();

    for (const row of data) {
      const key = (row[xColumn] ?? "").trim() || "Unknown";
      const rawY = row[yColumn] ?? "";
      const numericY = Number(rawY.replace(/,/g, ""));

      const bucket = groups.get(key) ?? { sum: 0, count: 0 };
      if (aggregation === "count") {
        bucket.count += 1;
      } else if (Number.isFinite(numericY)) {
        bucket.sum += numericY;
        bucket.count += 1;
      }

      groups.set(key, bucket);
    }

    return [...groups.entries()].map(([label, bucket]) => {
      const value = aggregation === "count"
        ? bucket.count
        : aggregation === "avg"
          ? (bucket.count > 0 ? bucket.sum / bucket.count : 0)
          : bucket.sum;

      return { label, value };
    });
  }, [aggregation, data, xColumn, yColumn]);

  if (aggregatedData.length === 0) {
    return <EmptyChartState title={title} reason="no-data" />;
  }

  const hideXAxisLabels = aggregatedData.length > 12;

  return (
    <div className="flex h-full flex-col">
      {showTitle ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={aggregatedData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }} style={{ background: "transparent" }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            angle={hideXAxisLabels ? 0 : -35}
            textAnchor={hideXAxisLabels ? "middle" : "end"}
            interval={0}
            hide={hideXAxisLabels}
            height={hideXAxisLabels ? 0 : 55}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis tickFormatter={(value: number) => formatCompact(value)} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
          <Tooltip
            formatter={(value: unknown) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              return formatNumber(numeric);
            }}
            labelFormatter={(label: unknown) => String(label ?? "")}
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
          <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
