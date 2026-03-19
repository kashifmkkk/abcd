"use client";

import { useState } from "react";
import type { DashboardSpec } from "@/types/spec";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { BarChartWidget } from "@/components/dashboard/widgets/BarChartWidget";
import { AreaChartWidget } from "@/components/dashboard/widgets/AreaChartWidget";
import { DonutChartWidget } from "@/components/dashboard/widgets/DonutChartWidget";
import { HistogramWidget } from "@/components/dashboard/widgets/HistogramWidget";
import { ChartTypeToggle } from "@/components/dashboard/widgets/ChartTypeToggle";

interface DashboardWorkspaceProps {
  projectId: string;
  initialSpec: DashboardSpec;
}

interface DashboardChartWidgetSwitchProps {
  type: "bar" | "area" | "donut" | "histogram";
  title: string;
  data: Record<string, string>[];
  xColumn: string;
  yColumn: string;
  aggregation: "sum" | "avg" | "count";
  availableTypes?: Array<"bar" | "area" | "donut" | "histogram">;
}

export function DashboardChartWidgetSwitch({
  type,
  title,
  data,
  xColumn,
  yColumn,
  aggregation,
  availableTypes,
}: DashboardChartWidgetSwitchProps) {
  const [chartType, setChartType] = useState<"bar" | "area" | "donut" | "histogram">(type);
  const allowed = availableTypes ?? ["bar", "area", "donut", "histogram"];
  const effectiveType = allowed.includes(chartType) ? chartType : allowed[0] ?? "bar";

  function renderChart() {
    switch (effectiveType) {
      case "bar":
        return (
          <BarChartWidget
            title={title}
            data={data}
            xColumn={xColumn}
            yColumn={yColumn}
            aggregation={aggregation}
          />
        );
      case "area":
        return <AreaChartWidget title={title} data={data} xColumn={xColumn} yColumn={yColumn} />;
      case "donut":
        return <DonutChartWidget title={title} data={data} dimension={xColumn} />;
      case "histogram":
        return (
          <HistogramWidget
            title={title}
            data={data}
            column={yColumn}
            buckets={10}
          />
        );
      default:
        return <div className="text-sm text-slate-500">Unsupported chart widget</div>;
    }
  }

  return (
    <div className="space-y-3">
      <ChartTypeToggle current={effectiveType} onChange={setChartType} availableTypes={allowed} />
      {renderChart()}
    </div>
  );
}

export function DashboardWorkspace({ projectId, initialSpec }: DashboardWorkspaceProps) {
  return (
    <section>
      <DashboardRenderer projectId={projectId} spec={initialSpec} />
    </section>
  );
}
