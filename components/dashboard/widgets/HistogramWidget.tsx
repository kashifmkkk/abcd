"use client";

/**
 * Statistical histogram widget that bins numeric values into fixed ranges.
 */

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatNumber } from "@/lib/utils/formatters";
import { EmptyChartState } from "@/components/dashboard/widgets/EmptyChartState";

interface HistogramWidgetProps {
  title: string;
  data: Record<string, string>[];
  column: string;
  buckets?: number;
  showTitle?: boolean;
}

interface HistogramBin {
  label: string;
  count: number;
  min: number;
  max: number;
}

function toFiniteNumber(value: string | undefined): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function HistogramWidget({ title, data, column, buckets = 10, showTitle = true }: HistogramWidgetProps) {
  const histogramData = useMemo<HistogramBin[]>(() => {
    const numericValues = data
      .map((row) => toFiniteNumber(row[column]))
      .filter((value): value is number => value !== null);

    if (numericValues.length === 0) return [];

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (Math.abs(max - min) < Number.EPSILON) {
      return [
        {
          label: `All values: ${formatCompact(min)}`,
          count: numericValues.length,
          min,
          max,
        },
      ];
    }

    const bucketCount = Math.max(1, Math.floor(buckets));
    const size = (max - min) / bucketCount;
    const bins = Array.from({ length: bucketCount }, (_, i) => {
      const binMin = min + size * i;
      const binMax = i === bucketCount - 1 ? max : min + size * (i + 1);
      return {
        label: `${formatCompact(binMin)} – ${formatCompact(binMax)}`,
        count: 0,
        min: binMin,
        max: binMax,
      };
    });

    for (const value of numericValues) {
      const rawIndex = (value - min) / size;
      const index = Math.min(bucketCount - 1, Math.max(0, Math.floor(rawIndex)));
      bins[index].count += 1;
    }

    return bins;
  }, [buckets, column, data]);

  if (histogramData.length === 0) {
    return <EmptyChartState title={title} reason="no-data" />;
  }

  return (
    <div className="flex h-full flex-col">
      {showTitle ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogramData} margin={{ top: 8, right: 12, left: 0, bottom: 32 }} barCategoryGap={0} style={{ background: "transparent" }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.5} />
          <XAxis dataKey="label" interval={0} angle={-30} textAnchor="end" height={56} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#334155" }} />
          <YAxis
            tickFormatter={(value: number) => formatNumber(value)}
            label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10 }}
            allowDecimals={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(label: unknown) => String(label ?? "")}
            formatter={(value: unknown, _name: unknown, payload: { payload?: HistogramBin } | undefined) => {
              const numeric = typeof value === "number" ? value : Number(value ?? 0);
              const p = payload?.payload;
              const range = p ? `${formatCompact(p.min)} – ${formatCompact(p.max)}` : "Range";
              return [`${formatNumber(numeric)} records`, range];
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
          <Bar dataKey="count" fill="#6366f1" />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
