"use client";

/**
 * Area chart widget for datetime trends with date-aware sorting.
 */

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "@/lib/utils/formatters";
import { EmptyChartState } from "@/components/dashboard/widgets/EmptyChartState";

interface AreaChartWidgetProps {
  title: string;
  data: Record<string, string>[];
  xColumn: string;
  yColumn: string;
  showTitle?: boolean;
}

interface AreaPoint {
  x: string;
  y: number;
  ts: number;
}

function toTimestamp(value: string): number {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}

function toMonthLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function AreaChartWidget({ title, data, xColumn, yColumn, showTitle = true }: AreaChartWidgetProps) {
  const sortedData = useMemo<AreaPoint[]>(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data
      .map((row) => {
        const x = (row[xColumn] ?? "").trim();
        const yRaw = row[yColumn] ?? "";
        const y = Number(yRaw.replace(/,/g, ""));
        return {
          x,
          y: Number.isFinite(y) ? y : 0,
          ts: toTimestamp(x),
        };
      })
      .sort((a, b) => a.ts - b.ts);
  }, [data, xColumn, yColumn]);

  if (sortedData.length === 0) {
    return <EmptyChartState title={title} reason="no-data" />;
  }

  return (
    <div className="flex h-full flex-col">
      {showTitle ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sortedData} margin={{ top: 8, right: 12, left: 0, bottom: 16 }} style={{ background: "transparent" }}>
          <defs>
            <linearGradient id="areaGradientIndigo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
          <XAxis dataKey="x" tickFormatter={(value: string) => toMonthLabel(value)} minTickGap={16} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#334155" }} />
          <YAxis tickFormatter={(value: number) => formatCompact(value)} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
          <Tooltip
            labelFormatter={(label: unknown) => toMonthLabel(String(label ?? ""))}
            formatter={(value: unknown) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              return formatCompact(numeric);
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
          <Area
            type="monotone"
            dataKey="y"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#areaGradientIndigo)"
            dot={false}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
