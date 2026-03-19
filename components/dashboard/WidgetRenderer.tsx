"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardFilters, DashboardWidgetModel } from "@/types/dashboard";
import type { DashboardSpec } from "@/types/spec";
import { KpiWidget } from "@/components/widgets/KpiWidget";
import { ChartWidget } from "@/components/widgets/ChartWidget";
import { TableWidget } from "@/components/widgets/TableWidget";
import { BarChartWidget } from "./widgets/BarChartWidget";
import { AreaChartWidget } from "./widgets/AreaChartWidget";
import { DonutChartWidget } from "./widgets/DonutChartWidget";
import { HistogramWidget } from "./widgets/HistogramWidget";
import { ChartTypeToggle } from "./widgets/ChartTypeToggle";
import { WidgetCard } from "./WidgetCard";

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
  const [chartType, setChartType] = useState<"bar" | "area" | "donut" | "histogram">(
    widget.chartType === "area" || widget.chartType === "donut" || widget.chartType === "histogram"
      ? widget.chartType
      : "bar"
  );

  useEffect(() => {
    const next =
      widget.chartType === "area" || widget.chartType === "donut" || widget.chartType === "histogram"
        ? widget.chartType
        : "bar";
    setChartType(next);
  }, [widget.id, widget.chartType]);

  function entityRowsAsStrings(): Record<string, string>[] {
    if (!effectiveEntity) return [];
    const raw = records[effectiveEntity] ?? [];

    return raw.map((item) => {
      const mapped: Record<string, string> = {};
      for (const [key, value] of Object.entries(item.data)) {
        if (value == null) {
          mapped[key] = "";
        } else if (typeof value === "string") {
          mapped[key] = value;
        } else if (typeof value === "number" || typeof value === "boolean") {
          mapped[key] = String(value);
        } else if (value instanceof Date) {
          mapped[key] = value.toISOString();
        } else {
          mapped[key] = String(value);
        }
      }
      return mapped;
    });
  }

  function resolveAvailableChartTypes(
    rows: Record<string, string>[],
    xColumn: string,
    yColumn: string
  ): Array<"bar" | "area" | "donut" | "histogram"> {
    if (xColumn === yColumn) {
      return ["histogram"];
    }

    const sample = rows.slice(0, 60).map((row) => row[xColumn] ?? "").filter((value) => value.trim().length > 0);
    const isDateLike = sample.length > 0 && sample.every((value) => !Number.isNaN(new Date(value).getTime()));
    if (isDateLike) {
      return ["area", "bar"];
    }

    const uniqueCount = new Set(sample).size;
    const ratio = sample.length > 0 ? uniqueCount / sample.length : 1;
    const isCategorical = sample.length > 0 && (uniqueCount < 15 || ratio < 0.35);
    if (isCategorical) {
      return ["bar", "donut"];
    }

    return ["bar", "area", "donut", "histogram"];
  }

  switch (widget.type) {
    case "kpi":
      if (!widget.metric && !effectiveEntity) {
        return (
          <WidgetCard>
            <div className="text-sm text-slate-500">Missing metric for KPI widget</div>
          </WidgetCard>
        );
      }

      return (
        <WidgetCard>
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
        </WidgetCard>
      );

    case "chart":
      {
        const rows = entityRowsAsStrings();
        const xColumn = widget.config?.xAxis ?? widget.metricX ?? "label";
        const yColumn = widget.config?.yAxis ?? widget.metrics?.[0] ?? "value";
        const aggregation = widget.config?.aggregation ?? "avg";
        const barAggregation: "sum" | "avg" | "count" =
          aggregation === "sum" || aggregation === "count" || aggregation === "avg"
            ? aggregation
            : "avg";
        const availableTypes = resolveAvailableChartTypes(rows, xColumn, yColumn);
        const effectiveType = availableTypes.includes(chartType) ? chartType : availableTypes[0] ?? "bar";

        return (
          <WidgetCard>
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-sm font-medium text-zinc-800">{widget.title}</h3>
              <ChartTypeToggle current={effectiveType} onChange={setChartType} availableTypes={availableTypes} />
            </div>

            <div className="flex-1 min-h-0">
              {effectiveType === "bar" ? (
                <BarChartWidget
                  title={widget.title}
                  data={rows}
                  xColumn={xColumn}
                  yColumn={yColumn}
                  aggregation={barAggregation}
                  showTitle={false}
                />
              ) : effectiveType === "area" ? (
                <AreaChartWidget
                  title={widget.title}
                  data={rows}
                  xColumn={xColumn}
                  yColumn={yColumn}
                  showTitle={false}
                />
              ) : effectiveType === "donut" ? (
                <DonutChartWidget
                  title={widget.title}
                  data={rows}
                  dimension={xColumn}
                  showTitle={false}
                />
              ) : (
                <HistogramWidget
                  title={widget.title}
                  data={rows}
                  column={yColumn}
                  buckets={10}
                  showTitle={false}
                />
              )}
            </div>
          </WidgetCard>
        );
      }

      const legacyChartType: "line" | "bar" | "pie" | "area" =
        widget.chartType === "line" || widget.chartType === "bar" || widget.chartType === "pie" || widget.chartType === "area"
          ? (widget.chartType as "line" | "bar" | "pie" | "area")
          : "bar";

      return (
        <WidgetCard>
          <ChartWidget
            projectId={projectId}
            title={widget.title}
            chartType={legacyChartType}
            metric={metricName}
            entity={effectiveEntity}
            xKey={widget.config?.xAxis ?? widget.metricX ?? "label"}
            field={effectiveYAxis}
            aggregation={effectiveAggregation}
            groupBy={effectiveGroupBy}
            filters={filters}
            refreshKey={refreshKey}
          />
        </WidgetCard>
      );

    case "table":
      if (!entity) {
        return (
          <WidgetCard>
            <div className="text-sm text-slate-500">Unknown entity for table widget</div>
          </WidgetCard>
        );
      }

      return (
        <WidgetCard>
          <TableWidget
            projectId={projectId}
            entity={entity}
            records={records[entity.name] ?? []}
            onRefresh={onRefresh}
            pagination={pagination}
            onPageChange={onPageChange ? (page) => onPageChange(entity.name, page) : undefined}
          />
        </WidgetCard>
      );

    default:
      return (
        <WidgetCard>
          <div className="text-sm text-slate-500">Unknown widget type</div>
        </WidgetCard>
      );
  }
}
