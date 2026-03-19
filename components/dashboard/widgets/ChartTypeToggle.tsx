"use client";

/**
 * Compact icon-only chart type toggle used inside widget cards.
 */

import { AlignLeft, AreaChart, BarChart2, PieChart } from "lucide-react";

type ToggleChartType = "bar" | "area" | "donut" | "histogram";

interface ChartTypeToggleProps {
  current: ToggleChartType;
  onChange: (type: ToggleChartType) => void;
  availableTypes?: ToggleChartType[];
}

const ALL_TYPES: ToggleChartType[] = ["bar", "area", "donut", "histogram"];

const ICON_MAP = {
  bar: BarChart2,
  area: AreaChart,
  donut: PieChart,
  histogram: AlignLeft,
} as const;

export function ChartTypeToggle({
  current,
  onChange,
  availableTypes = ALL_TYPES,
}: ChartTypeToggleProps) {
  return (
    <div className="flex h-10 max-h-10 items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800/80">
      {availableTypes.map((type) => {
        const Icon = ICON_MAP[type];
        const active = current === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              active
                ? "bg-[#6366f1] text-white"
                : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
            aria-label={`Switch chart type to ${type}`}
            title={type}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
