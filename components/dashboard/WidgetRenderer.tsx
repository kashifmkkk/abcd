"use client";

import { useMemo } from "react";
import type { DashboardSpec, EntityDef, WidgetDef } from "@/types/spec";
import { KpiWidget } from "@/components/widgets/KpiWidget";
import { ChartWidget } from "@/components/widgets/ChartWidget";
import { TableWidget } from "@/components/widgets/TableWidget";

interface WidgetRendererProps {
  projectId: string;
  widget: WidgetDef;
  spec: DashboardSpec;
  records: Record<string, Array<{ id: string; data: Record<string, unknown> }>>;
  refreshKey: number;
  onRefresh: () => Promise<void>;
}

function getEntityFromWidget(widget: WidgetDef, entities: EntityDef[]): EntityDef | null {
  if (!widget.entity) return null;
  return entities.find((entity) => entity.name === widget.entity) ?? null;
}

function resolveChartMetric(widget: WidgetDef, spec: DashboardSpec): string | undefined {
  if (widget.metric && spec.metrics.some((metric) => metric.name === widget.metric)) {
    return widget.metric;
  }

  if (!widget.entity || !widget.metrics?.[0]) return undefined;

  const metricByField = spec.metrics.find(
    (metric) => metric.entity === widget.entity && metric.field === widget.metrics?.[0]
  );
  if (metricByField) return metricByField.name;

  const countMetric = spec.metrics.find(
    (metric) => metric.entity === widget.entity && metric.operation === "count"
  );

  return countMetric?.name;
}

export function WidgetRenderer({
  projectId,
  widget,
  spec,
  records,
  refreshKey,
  onRefresh,
}: WidgetRendererProps) {
  const entity = useMemo(() => getEntityFromWidget(widget, spec.entities), [widget, spec.entities]);
  const metricName = useMemo(() => resolveChartMetric(widget, spec), [widget, spec]);

  switch (widget.type) {
    case "kpi":
      if (!widget.metric) {
        return <div className="text-sm text-slate-500">Missing metric for KPI widget</div>;
      }

      return (
        <KpiWidget
          projectId={projectId}
          title={widget.title}
          metric={widget.metric}
          refreshKey={refreshKey}
        />
      );

    case "chart":
      return (
        <ChartWidget
          projectId={projectId}
          title={widget.title}
          chartType={widget.chartType ?? "bar"}
          metric={metricName}
          entity={widget.entity}
          xKey={widget.metricX ?? "name"}
          fields={widget.metrics ?? []}
          refreshKey={refreshKey}
        />
      );

    case "table":
      if (!entity) {
        return <div className="text-sm text-slate-500">Unknown entity for table widget</div>;
      }

      return (
        <TableWidget
          projectId={projectId}
          entity={entity}
          records={records[entity.name] ?? []}
          onRefresh={onRefresh}
        />
      );

    default:
      return <div className="text-sm text-slate-500">Unknown widget type</div>;
  }
}
