"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Responsive, WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import {
  Copy,
  Edit3,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AddWidgetDialog } from "@/components/dashboard/AddWidgetDialog";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { WidgetSettingsSheet } from "@/components/dashboard/WidgetSettingsSheet";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appendDashboardFilters } from "@/lib/dashboard/filters";
import type { DashboardCustomizationState, DashboardFilters, DashboardWidgetModel, WidgetVisualization } from "@/types/dashboard";
import type { DashboardSpec } from "@/types/spec";

interface DashboardRendererProps {
  projectId: string;
  spec: DashboardSpec;
}

type EntityRecordsMap = Record<string, Array<{ id: string; data: Record<string, unknown> }>>;
type EntityPaginationMap = Record<string, { page: number; pageSize: number; total: number }>;
const ResponsiveGridLayout = WidthProvider(Responsive);

function getDefaultLayout(widgetId: string, index = 0, widgetType?: string, chartType?: string): LayoutItem {
  if (widgetType === "kpi") {
    return { i: widgetId, x: (index * 4) % 12, y: Math.floor(index / 3) * 2, w: 4, h: 2 };
  }
  if (chartType === "donut") {
    return { i: widgetId, x: (index * 4) % 12, y: Math.floor(index / 3) * 3, w: 4, h: 3 };
  }
  if (widgetType === "table") {
    return { i: widgetId, x: 0, y: 999, w: 12, h: 4 };
  }
  return { i: widgetId, x: (index * 6) % 12, y: Math.floor(index / 2) * 3, w: 6, h: 3 };
}

function toVisualization(widget: DashboardWidgetModel): WidgetVisualization {
  if (widget.type === "kpi") return "metric";
  if (widget.type === "table") return "table";
  if (widget.chartType === "line" || widget.chartType === "bar" || widget.chartType === "area" || widget.chartType === "pie" || widget.chartType === "donut" || widget.chartType === "histogram") {
    return widget.chartType;
  }
  return "bar";
}

function applyVisualization(widget: DashboardWidgetModel, visualization: WidgetVisualization): DashboardWidgetModel {
  if (visualization === "metric") {
    return { ...widget, type: "kpi", chartType: undefined };
  }

  if (visualization === "table") {
    return { ...widget, type: "table", chartType: undefined };
  }

  return { ...widget, type: "chart", chartType: visualization };
}

export function DashboardRenderer({ projectId, spec }: DashboardRendererProps) {
  const searchParams = useSearchParams();
  const lastUploadTimestamp = searchParams.get("uploadedAt") ?? "";
  const initialLayout = useMemo<LayoutItem[]>(() => {
    const widgetById = new Map(spec.widgets.map((widget) => [widget.id, widget]));
    return (spec.layout.items as unknown as LayoutItem[]).map((item) => {
      const widget = widgetById.get(item.i);
      const minHeight = widget?.type === "kpi" ? 2 : widget?.type === "table" ? 4 : 3;
      return { ...item, h: Math.max(item.h, minHeight) };
    });
  }, [spec.layout.items, spec.widgets]);
  const [records, setRecords] = useState<EntityRecordsMap>({});
  const [entityPagination, setEntityPagination] = useState<EntityPaginationMap>({});
  const [widgets, setWidgets] = useState<DashboardWidgetModel[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>(initialLayout);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [filterOptions, setFilterOptions] = useState<DashboardCustomizationState["filterOptions"]>({
    categories: [],
    regions: [],
    statuses: [],
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const fetchEntity = useCallback(
    async (entityName: string, activeFilters: DashboardFilters = filters, page = 1) => {
      const params = new URLSearchParams({ projectId, page: String(page), pageSize: "50" });
      appendDashboardFilters(params, activeFilters);

      const res = await fetch(`/api/entities/${entityName}?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        const payload = json.data;
        setRecords((prev) => ({ ...prev, [entityName]: payload.records ?? payload }));
        setEntityPagination((prev) => ({
          ...prev,
          [entityName]: { page: payload.page ?? 1, pageSize: payload.pageSize ?? 50, total: payload.total ?? 0 },
        }));
      }
    },
    [filters, projectId]
  );

  const loadDashboardState = useCallback(async () => {
    const params = new URLSearchParams();
    appendDashboardFilters(params, filters);
    const response = await fetch(`/api/dashboard/${projectId}?${params.toString()}`, { cache: "no-store" });
    const json = (await response.json()) as {
      success?: boolean;
      data?: DashboardCustomizationState;
    };

    if (response.ok && json.success && json.data) {
      setWidgets(json.data.widgets);
      setLayout(json.data.layout.items as unknown as LayoutItem[]);
      setFilterOptions(json.data.filterOptions);
    }

    setRefreshKey((prev) => prev + 1);
    setIsBootstrapping(false);
  }, [filters, projectId]);

  const refreshAll = useCallback(async () => {
    await Promise.all(spec.entities.map((entity) => fetchEntity(entity.name, filters)));
    await loadDashboardState();
  }, [fetchEntity, filters, loadDashboardState, spec.entities]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!lastUploadTimestamp) return;
    void refreshAll();
  }, [lastUploadTimestamp, refreshAll]);

  const sortedWidgets = useMemo(() => {
    const index = new Map(layout.map((item, position) => [item.i, { ...item, position }]));
    return [...widgets].sort((a, b) => {
      const aLayout = index.get(a.id);
      const bLayout = index.get(b.id);

      if (!aLayout && !bLayout) return 0;
      if (!aLayout) return 1;
      if (!bLayout) return -1;

      if (aLayout.y !== bLayout.y) return aLayout.y - bLayout.y;
      if (aLayout.x !== bLayout.x) return aLayout.x - bLayout.x;
      return aLayout.position - bLayout.position;
    });
  }, [layout, widgets]);

  const hasAnyWidgets = sortedWidgets.length > 0;

  const getWidgetLayout = useCallback(
    (widget: DashboardWidgetModel) => {
      const index = sortedWidgets.findIndex((item) => item.id === widget.id);
      return layout.find((item) => item.i === widget.id) ?? getDefaultLayout(widget.id, index, widget.type, widget.chartType);
    },
    [layout, sortedWidgets]
  );

  const editingWidget = useMemo(
    () => sortedWidgets.find((widget) => widget.id === editingWidgetId) ?? null,
    [editingWidgetId, sortedWidgets]
  );

  const persistDashboard = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/dashboard/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: {
            columns: spec.layout.columns,
            items: layout.map((item) => ({
              i: item.i,
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
              ...(item.minW ? { minW: item.minW } : {}),
              ...(item.minH ? { minH: item.minH } : {}),
            })),
          },
          widgets: sortedWidgets,
        }),
      });
      setIsDirty(false);
      await loadDashboardState();
    } finally {
      setIsSaving(false);
    }
  }, [layout, loadDashboardState, projectId, sortedWidgets, spec.layout.columns]);

  function updateLayout(nextLayout: LayoutItem[]) {
    setLayout(nextLayout);
    setIsDirty(true);
  }

  function updateWidget(widgetId: string, updater: (widget: DashboardWidgetModel) => DashboardWidgetModel) {
    setWidgets((prev) => prev.map((widget) => (widget.id === widgetId ? updater(widget) : widget)));
    setIsDirty(true);
  }

  function deleteWidget(widgetId: string) {
    setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
    setLayout((prev) => prev.filter((item) => item.i !== widgetId));
    setIsDirty(true);
  }

  function duplicateWidget(widgetId: string) {
    const sourceWidget = sortedWidgets.find((widget) => widget.id === widgetId);
    const sourceLayout = layout.find((item) => item.i === widgetId);
    if (!sourceWidget) return;

    const duplicateId = `widget_${crypto.randomUUID().slice(0, 8)}`;
    const duplicateWidgetItem: DashboardWidgetModel = {
      ...sourceWidget,
      id: duplicateId,
      title: `${sourceWidget.title} copy`,
    };

    const duplicateLayoutItem = sourceLayout
      ? {
          ...sourceLayout,
          i: duplicateId,
          x: (sourceLayout.x + 1) % spec.layout.columns,
          y: sourceLayout.y + 1,
        }
      : getDefaultLayout(duplicateId, sortedWidgets.length, sourceWidget.type, sourceWidget.chartType);

    setWidgets((prev) => [...prev, duplicateWidgetItem]);
    setLayout((prev) => [...prev, duplicateLayoutItem]);
    setIsDirty(true);
  }

  return (
    <div className="space-y-6 p-6">
      <section id="dashboard-section" className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Customizable dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Drag, resize, filter, and save widgets without losing the AI-generated starting point.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date from</span>
              <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value || undefined }))} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date to</span>
              <Input type="date" value={filters.dateTo ?? ""} onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value || undefined }))} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</span>
              <select
                value={filters.category ?? ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value || undefined }))}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All categories</option>
                {filterOptions.categories.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Region</span>
              <select
                value={filters.region ?? ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, region: event.target.value || undefined }))}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All regions</option>
                {filterOptions.regions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
              <select
                value={filters.status ?? ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value || undefined }))}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All statuses</option>
                {filterOptions.statuses.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setFilters({})}>Reset filters</Button>
            <Button onClick={() => void persistDashboard()} disabled={!isDirty || isSaving}>
              <Save size={14} />
              {isSaving ? "Saving..." : isDirty ? "Save dashboard" : "Saved"}
            </Button>
          </div>
        </div>
      </section>

      <InsightsPanel projectId={projectId} filters={filters} refreshKey={refreshKey} />

      {hasAnyWidgets ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: sortedWidgets.map((widget) => getWidgetLayout(widget)) }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
          rowHeight={160}
          margin={[16, 16]}
          containerPadding={[16, 16]}
          isResizable
          draggableHandle=".drag-handle"
          onLayoutChange={(next) => updateLayout(next as LayoutItem[])}
        >
          {sortedWidgets.map((widget) => {
            const widgetLayout = getWidgetLayout(widget);
            const visualization = toVisualization(widget);

            return (
              <div key={widget.id} data-grid={widgetLayout} className="h-full">
                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/85 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/85">
                    <button
                      type="button"
                      className="drag-handle flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      title="Drag widget"
                    >
                      <GripVertical size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingWidgetId(widget.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        title="Edit widget"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateWidget(widget.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        title="Duplicate widget"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWidget(widget.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        title="Delete widget"
                      >
                        <Trash2 size={14} />
                      </button>
                      <select
                        value={visualization}
                        onChange={(event) => updateWidget(widget.id, (current) => applyVisualization(current, event.target.value as WidgetVisualization))}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        title="Change chart type"
                      >
                        <option value="line">Line</option>
                        <option value="bar">Bar</option>
                        <option value="area">Area</option>
                        <option value="pie">Pie</option>
                        <option value="table">Table</option>
                        <option value="metric">Metric</option>
                      </select>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 h-full p-2">
                    <WidgetRenderer
                      projectId={projectId}
                      widget={widget}
                      spec={spec}
                      records={records}
                      filters={filters}
                      refreshKey={refreshKey}
                      onRefresh={refreshAll}
                      pagination={widget.entity ? entityPagination[widget.entity] : undefined}
                      onPageChange={(entityName, page) => void fetchEntity(entityName, filters, page)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      ) : null}

      {!hasAnyWidgets && !isBootstrapping ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          This dashboard has no widgets yet.
        </section>
      ) : null}

      <AddWidgetDialog
        open={isAddWidgetOpen}
        entities={spec.entities}
        onOpenChange={setIsAddWidgetOpen}
        onCreate={(widget) => {
          setWidgets((prev) => [...prev, widget]);
          setLayout((prev) => [...prev, getDefaultLayout(widget.id, prev.length, widget.type, widget.chartType)]);
          setIsDirty(true);
        }}
      />

      <WidgetSettingsSheet
        open={Boolean(editingWidget)}
        widget={editingWidget}
        entities={spec.entities}
        onOpenChange={(open) => {
          if (!open) setEditingWidgetId(null);
        }}
        onSave={(widget) => {
          updateWidget(widget.id, () => widget);
          setEditingWidgetId(null);
        }}
      />

      <div className="fixed bottom-8 right-8 z-30">
        <Button size="lg" className="rounded-full px-5 shadow-lg" onClick={() => setIsAddWidgetOpen(true)}>
          <Plus size={16} />
          Add Widget
        </Button>
      </div>
    </div>
  );
}
