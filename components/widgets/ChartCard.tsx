"use client";

import type { ReactNode } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Generic ChartCard wrapper ---

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  icon,
  headerAction,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              {icon}
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            {description ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="flex-1 min-h-0 p-4">{children}</div>
    </div>
  );
}

// --- Built-in chart types ---

interface ChartDataPoint {
  label?: string;
  x?: string | number;
  value?: number;
  [key: string]: unknown;
}

interface EmbeddedChartProps {
  data: ChartDataPoint[];
  type?: "line" | "bar" | "area";
  dataKey?: string;
  xKey?: string;
  height?: number;
  color?: string;
}

const CHART_COLOR = "#6366f1"; // indigo-500

export function EmbeddedLineChart({
  data,
  dataKey = "value",
  xKey = "label",
  height = 220,
  color = CHART_COLOR,
}: EmbeddedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmbeddedBarChart({
  data,
  dataKey = "value",
  xKey = "label",
  height = 220,
  color = CHART_COLOR,
}: EmbeddedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EmbeddedAreaChart({
  data,
  dataKey = "value",
  xKey = "label",
  height = 220,
  color = CHART_COLOR,
}: EmbeddedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-slate-500 dark:text-slate-400"
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill="url(#areaGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
