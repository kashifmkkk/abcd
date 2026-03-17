"use client";

import { useMemo } from "react";
import type { DashboardFilters, DashboardWidgetModel } from "@/types/dashboard";
import type { DashboardSpec } from "@/types/spec";
import { KpiWidget } from "@/components/widgets/KpiWidget";
import { ChartWidget } from "@/components/widgets/ChartWidget";
import { TableWidget } from "@/components/widgets/TableWidget";

interface WidgetRendererProps {
  projectId: string;
  widget: DashboardWidgetModel;
  spec: DashboardSpec;
  records: Record<string, Array<{ id: string; data: Record<string, unknown> }>>;
  filters: DashboardFilters;
  refreshKey: number;
  onRefresh: () => Promise<void>;
  pagination?: { page: number; pageSize: number; total: number };
  onPageChange?: (entityName: string, page: number) => void;
}

function resolveChartMetric(widget: DashboardWidgetModel, spec: DashboardSpec): string | undefined {
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
  filters,
  refreshKey,
  onRefresh,
  pagination,
  onPageChange,
}: WidgetRendererProps) {
  const entity = useMemo(
    () => spec.entities.find((item) => item.name === widget.entity) ?? null,
    [widget, spec.entities]
  );
  const metricName = useMemo(() => resolveChartMetric(widget, spec), [widget, spec]);
  const effectiveEntity = widget.entity ?? entity?.name;
  const effectiveAggregation = widget.config?.aggregation;
  const effectiveYAxis = widget.config?.yAxis ?? widget.metrics?.[0];
  const effectiveGroupBy = widget.config?.groupBy ?? widget.config?.xAxis ?? widget.metricX;

  switch (widget.type) {
    case "kpi":
      if (!widget.metric && !effectiveEntity) {
        return <div className="text-sm text-slate-500">Missing metric for KPI widget</div>;
      }

      return (
        <KpiWidget
          projectId={projectId}
          title={widget.title}
          metric={widget.metric}
          entity={effectiveEntity}
          field={effectiveYAxis}
          aggregation={effectiveAggregation}
          groupBy={effectiveGroupBy}
          filters={filters}
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
          entity={effectiveEntity}
          xKey={widget.config?.xAxis ?? widget.metricX ?? "label"}
          field={effectiveYAxis}
          aggregation={effectiveAggregation}
          groupBy={effectiveGroupBy}
          filters={filters}
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
          pagination={pagination}
          onPageChange={onPageChange ? (page) => onPageChange(entity.name, page) : undefined}
        />
      );

    default:
      return <div className="text-sm text-slate-500">Unknown widget type</div>;
  }
}
