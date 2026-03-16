"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Responsive, WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import type { DashboardSpec, WidgetDef } from "@/types/spec";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { GripVertical } from "lucide-react";

interface DashboardRendererProps {
  projectId: string;
  spec: DashboardSpec;
}

type EntityRecordsMap = Record<string, Array<{ id: string; data: Record<string, unknown> }>>;
const ResponsiveGridLayout = WidthProvider(Responsive);

function getDefaultLayout(widgetId: string): LayoutItem {
  return { i: widgetId, x: 0, y: 0, w: 6, h: 4 };
}

export function DashboardRenderer({ projectId, spec }: DashboardRendererProps) {
  const searchParams = useSearchParams();
  const lastUploadTimestamp = searchParams.get("uploadedAt") ?? "";
  const [records, setRecords] = useState<EntityRecordsMap>({});
  const [layout, setLayout] = useState<LayoutItem[]>(spec.layout.items as unknown as LayoutItem[]);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasMountedRef = useRef(false);

  const fetchEntity = useCallback(
    async (entityName: string) => {
      const res = await fetch(`/api/entities/${entityName}?projectId=${projectId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setRecords((prev) => ({ ...prev, [entityName]: json.data }));
      }
    },
    [projectId]
  );

  const refreshDashboardSnapshot = useCallback(async () => {
    await fetch(`/api/dashboard/${projectId}`, { cache: "no-store" });
    setRefreshKey((prev) => prev + 1);
  }, [projectId]);

  const refreshAll = useCallback(async () => {
    await Promise.all(spec.entities.map((entity) => fetchEntity(entity.name)));
    await refreshDashboardSnapshot();
  }, [fetchEntity, refreshDashboardSnapshot, spec.entities]);

  useEffect(() => {
    void Promise.all(spec.entities.map((entity) => fetchEntity(entity.name)));
  }, [fetchEntity, spec.entities]);

  useEffect(() => {
    if (!lastUploadTimestamp) return;
    void refreshAll();
  }, [lastUploadTimestamp, refreshAll]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeout = setTimeout(async () => {
      const layoutPayload = {
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
      };

      await fetch(`/api/layout/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: layoutPayload }),
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [layout, projectId, spec.layout.columns]);

  const sortedWidgets = useMemo(() => {
    const index = new Map(layout.map((item, position) => [item.i, { ...item, position }]));
    return [...spec.widgets].sort((a, b) => {
      const aLayout = index.get(a.id);
      const bLayout = index.get(b.id);

      if (!aLayout && !bLayout) return 0;
      if (!aLayout) return 1;
      if (!bLayout) return -1;

      if (aLayout.y !== bLayout.y) return aLayout.y - bLayout.y;
      if (aLayout.x !== bLayout.x) return aLayout.x - bLayout.x;
      return aLayout.position - bLayout.position;
    });
  }, [layout, spec.widgets]);

  const kpiWidgets = useMemo(() => sortedWidgets.filter((widget) => widget.type === "kpi"), [sortedWidgets]);
  const chartWidgets = useMemo(() => sortedWidgets.filter((widget) => widget.type === "chart"), [sortedWidgets]);
  const tableWidgets = useMemo(() => sortedWidgets.filter((widget) => widget.type === "table"), [sortedWidgets]);

  const hasAnyWidgets = sortedWidgets.length > 0;

  const getWidgetLayout = useCallback(
    (widget: WidgetDef) => layout.find((item) => item.i === widget.id) ?? getDefaultLayout(widget.id),
    [layout]
  );

  function updateSectionLayout(nextLayout: LayoutItem[], baseY: number) {
    setLayout((prev) => {
      const byId = new Map(prev.map((item) => [item.i, item]));

      for (const item of nextLayout) {
        byId.set(item.i, { ...item, y: item.y + baseY });
      }

      const result = prev.map((item) => byId.get(item.i) ?? item);

      for (const item of nextLayout) {
        if (!prev.some((existing) => existing.i === item.i)) {
          result.push({ ...item, y: item.y + baseY });
        }
      }

      return result;
    });
  }

  function renderWidgetGrid(widgets: WidgetDef[]) {
    if (widgets.length === 0) {
      return null;
    }

    const rawLayouts = widgets.map((widget) => getWidgetLayout(widget));
    const minY = rawLayouts.reduce((min, item) => Math.min(min, item.y), Number.POSITIVE_INFINITY);
    const baseY = Number.isFinite(minY) ? minY : 0;

    const normalizedLayouts = rawLayouts.map((item) => ({
      ...item,
      y: item.y - baseY,
    }));

    return (
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: normalizedLayouts }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{
          lg: spec.layout.columns,
          md: spec.layout.columns,
          sm: spec.layout.columns,
          xs: spec.layout.columns,
          xxs: spec.layout.columns,
        }}
        rowHeight={44}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={(next) => updateSectionLayout(next as LayoutItem[], baseY)}
        draggableHandle=".drag-handle"
      >
        {widgets.map((widget) => {
          const widgetLayout = normalizedLayouts.find((item) => item.i === widget.id) ?? getDefaultLayout(widget.id);
          const entitySectionId = widget.type === "table" && widget.entity ? `section-${widget.entity}` : undefined;

          return (
            <div key={widget.id} data-grid={widgetLayout} className="relative h-full overflow-hidden" id={entitySectionId}>
              <div className="drag-handle absolute right-2 top-2 z-10 cursor-move rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-400 transition-colors">
                <GripVertical size={13} />
              </div>
              <WidgetRenderer
                projectId={projectId}
                widget={widget}
                spec={spec}
                records={records}
                refreshKey={refreshKey}
                onRefresh={refreshAll}
              />
            </div>
          );
        })}
      </ResponsiveGridLayout>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section id="dashboard-section" className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Comprehensive analytics and marketplace insights</p>
      </section>

      {kpiWidgets.length > 0 ? (
        <section id="kpi-section" className="space-y-3">
          <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">KPI Metrics</h3>
          {renderWidgetGrid(kpiWidgets)}
        </section>
      ) : null}

      {chartWidgets.length > 0 ? (
        <section id="charts-section" className="space-y-3">
          <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">Sales Trends</h3>
          {renderWidgetGrid(chartWidgets)}
        </section>
      ) : null}

      {tableWidgets.length > 0 ? (
        <section id="tables-section" className="space-y-3">
          <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100">Performance Metrics</h3>
          {renderWidgetGrid(tableWidgets)}
        </section>
      ) : null}

      {!hasAnyWidgets ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          This dashboard has no widgets yet.
        </section>
      ) : null}
    </div>
  );
}
