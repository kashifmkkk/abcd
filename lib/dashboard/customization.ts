import { prisma } from "@/lib/db/client";
import { collectDashboardFilterOptions } from "@/lib/dashboard/filters";
import type { DashboardCustomizationState, DashboardSaveInput, DashboardWidgetModel } from "@/types/dashboard";
import type { DashboardSpec, LayoutDef, LayoutItem, MetricDef, WidgetDef } from "@/types/spec";

type DashboardCustomizationClient = typeof prisma & {
  dashboardLayout: {
    findUnique: (args: { where: { projectId: string } }) => Promise<{ columns: number; items: unknown } | null>;
    upsert: (args: {
      where: { projectId: string };
      create: { projectId: string; columns: number; items: object };
      update: { columns: number; items: object };
    }) => Promise<unknown>;
  };
  dashboardWidget: {
    findMany: (args: {
      where: { projectId: string };
      orderBy: { position: "asc" | "desc" };
      include: { config: true };
    }) => Promise<Array<{
      id: string;
      title: string;
      type: string;
      description: string | null;
      entity: string | null;
      metric: string | null;
      chartType: string | null;
      metricX: string | null;
      metrics: unknown;
      config: {
        xAxis: string | null;
        yAxis: string | null;
        aggregation: string | null;
        groupBy: string | null;
        settings: unknown;
      } | null;
    }>>;
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    upsert: (args: {
      where: { id: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  widgetConfig: {
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>;
    upsert: (args: {
      where: { widgetId: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

const customizationPrisma = prisma as DashboardCustomizationClient;

function getDefaultLayoutItem(widgetId: string, index: number): LayoutItem {
  return {
    i: widgetId,
    x: (index * 6) % 12,
    y: Math.floor(index / 2) * 4,
    w: 6,
    h: 4,
  };
}

function findMetric(spec: DashboardSpec, name?: string): MetricDef | undefined {
  if (!name) return undefined;
  return spec.metrics.find((metric) => metric.name === name);
}

function buildLegacyWidget(widget: WidgetDef, spec: DashboardSpec): DashboardWidgetModel {
  const metric = findMetric(spec, widget.metric);

  return {
    ...widget,
    chartType: widget.chartType ?? "bar",
    config: {
      xAxis: widget.config?.xAxis ?? widget.metricX,
      yAxis: widget.config?.yAxis ?? metric?.field ?? widget.metrics?.[0],
      aggregation: widget.config?.aggregation ?? metric?.operation ?? (widget.type === "kpi" ? "count" : "sum"),
      groupBy: widget.config?.groupBy ?? widget.metricX,
      settings: widget.config?.settings,
    },
    entity: widget.entity ?? metric?.entity,
  };
}

function normalizeLayout(layout: LayoutDef, widgets: DashboardWidgetModel[]): LayoutDef {
  const existing = new Map(layout.items.map((item) => [item.i, item]));
  const items = widgets.map((widget, index) => existing.get(widget.id) ?? getDefaultLayoutItem(widget.id, index));
  return {
    columns: layout.columns || 12,
    items,
  };
}

function mergeWidgets(
  persistedWidgets: DashboardWidgetModel[],
  legacyWidgets: DashboardWidgetModel[]
): DashboardWidgetModel[] {
  const persistedIds = new Set(persistedWidgets.map((widget) => widget.id));
  const merged = [...persistedWidgets];

  for (const widget of legacyWidgets) {
    if (!persistedIds.has(widget.id)) {
      merged.push(widget);
    }
  }

  return merged;
}

function toWidgetModel(row: {
  id: string;
  title: string;
  type: string;
  description: string | null;
  entity: string | null;
  metric: string | null;
  chartType: string | null;
  metricX: string | null;
  metrics: unknown;
  config: {
    xAxis: string | null;
    yAxis: string | null;
    aggregation: string | null;
    groupBy: string | null;
    settings: unknown;
  } | null;
}): DashboardWidgetModel {
  return {
    id: row.id,
    title: row.title,
    type: row.type as DashboardWidgetModel["type"],
    description: row.description ?? undefined,
    entity: row.entity ?? undefined,
    metric: row.metric ?? undefined,
    chartType: (row.chartType as DashboardWidgetModel["chartType"]) ?? undefined,
    metricX: row.metricX ?? undefined,
    metrics: Array.isArray(row.metrics) ? (row.metrics as string[]) : undefined,
    config: row.config
      ? {
          xAxis: row.config.xAxis ?? undefined,
          yAxis: row.config.yAxis ?? undefined,
          aggregation:
            (row.config.aggregation as NonNullable<DashboardWidgetModel["config"]>["aggregation"]) ?? undefined,
          groupBy: row.config.groupBy ?? undefined,
          settings:
            row.config.settings && typeof row.config.settings === "object"
              ? (row.config.settings as Record<string, unknown>)
              : undefined,
        }
      : undefined,
  };
}

export async function getDashboardCustomization(projectId: string, spec: DashboardSpec): Promise<DashboardCustomizationState> {
  const [layoutRow, widgetRows, filterRows] = await Promise.all([
    customizationPrisma.dashboardLayout.findUnique({ where: { projectId } }),
    customizationPrisma.dashboardWidget.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      include: { config: true },
    }),
    customizationPrisma.dashboardData.findMany({
      where: { projectId },
      select: { data: true, createdAt: true },
      take: 1000,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const legacyWidgets = spec.widgets.map((widget) => buildLegacyWidget(widget, spec));
  const persistedWidgets = widgetRows.map(toWidgetModel);
  const widgets = mergeWidgets(persistedWidgets, legacyWidgets);
  const legacyLayout = normalizeLayout(spec.layout, legacyWidgets);
  const layout = normalizeLayout(
    layoutRow
      ? {
          columns: layoutRow.columns,
          items: Array.isArray(layoutRow.items) ? (layoutRow.items as unknown as LayoutItem[]) : [],
        }
      : legacyLayout,
    widgets
  );

  return {
    widgets,
    layout,
    filterOptions: collectDashboardFilterOptions(filterRows.map((row: { data: unknown; createdAt: Date }) => ({
      data: row.data as Record<string, unknown>,
      createdAt: row.createdAt,
    }))),
  };
}

export async function saveDashboardCustomization(projectId: string, input: DashboardSaveInput) {
  const widgetIds = input.widgets.map((widget) => widget.id);

  await customizationPrisma.$transaction(async (tx) => {
    const transactionClient = tx as DashboardCustomizationClient;

    await transactionClient.dashboardLayout.upsert({
      where: { projectId },
      create: {
        projectId,
        columns: input.layout.columns,
        items: input.layout.items as unknown as object,
      },
      update: {
        columns: input.layout.columns,
        items: input.layout.items as unknown as object,
      },
    });

    await transactionClient.widgetConfig.deleteMany({
      where: {
        widget: {
          projectId,
          ...(widgetIds.length > 0 ? { id: { notIn: widgetIds } } : {}),
        },
      },
    });

    await transactionClient.dashboardWidget.deleteMany({
      where: {
        projectId,
        ...(widgetIds.length > 0 ? { id: { notIn: widgetIds } } : {}),
      },
    });

    for (const [position, widget] of input.widgets.entries()) {
      await transactionClient.dashboardWidget.upsert({
        where: { id: widget.id },
        create: {
          id: widget.id,
          projectId,
          title: widget.title,
          type: widget.type,
          description: widget.description,
          entity: widget.entity,
          metric: widget.metric,
          chartType: widget.chartType,
          metricX: widget.metricX,
          metrics: widget.metrics as unknown as object,
          position,
        },
        update: {
          title: widget.title,
          type: widget.type,
          description: widget.description,
          entity: widget.entity,
          metric: widget.metric,
          chartType: widget.chartType,
          metricX: widget.metricX,
          metrics: widget.metrics as unknown as object,
          position,
        },
      });

      await transactionClient.widgetConfig.upsert({
        where: { widgetId: widget.id },
        create: {
          widgetId: widget.id,
          xAxis: widget.config?.xAxis,
          yAxis: widget.config?.yAxis,
          aggregation: widget.config?.aggregation,
          groupBy: widget.config?.groupBy,
          settings: widget.config?.settings as unknown as object,
        },
        update: {
          xAxis: widget.config?.xAxis,
          yAxis: widget.config?.yAxis,
          aggregation: widget.config?.aggregation,
          groupBy: widget.config?.groupBy,
          settings: widget.config?.settings as unknown as object,
        },
      });
    }
  });
}