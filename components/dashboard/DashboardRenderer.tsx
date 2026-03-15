"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Responsive, WidthProvider, type LayoutItem } from "react-grid-layout/legacy";
import type { DashboardSpec } from "@/types/spec";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { useDashboardData } from "@/hooks/useDashboardData";

interface DashboardRendererProps {
  projectId: string;
  spec: DashboardSpec;
}

type EntityRecordsMap = Record<string, Array<{ id: string; data: Record<string, unknown> }>>;
const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardRenderer({ projectId, spec }: DashboardRendererProps) {
  const { tick, refresh } = useDashboardData(projectId);
  const [records, setRecords] = useState<EntityRecordsMap>({});
  const [layout, setLayout] = useState<LayoutItem[]>(spec.layout.items as unknown as LayoutItem[]);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasMountedRef = useRef(false);

  const fetchEntity = useCallback(
    async (entityName: string) => {
      const res = await fetch(`/api/entities/${entityName}?projectId=${projectId}`);
      const json = await res.json();
      if (json.success) {
        setRecords((prev) => ({ ...prev, [entityName]: json.data }));
      }
    },
    [projectId]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(spec.entities.map((e) => fetchEntity(e.name)));
    await refresh();
  }, [fetchEntity, refresh, spec.entities]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setRefreshKey(tick);
    void Promise.all(spec.entities.map((e) => fetchEntity(e.name)));
  }, [tick, fetchEntity, spec.entities]);

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

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{
        lg: spec.layout.columns,
        md: spec.layout.columns,
        sm: spec.layout.columns,
        xs: spec.layout.columns,
        xxs: spec.layout.columns,
      }}
      rowHeight={44}
      margin={[12, 12]}
      containerPadding={[0, 0]}
      onLayoutChange={(next) => setLayout([...next])}
      draggableHandle=".drag-handle"
    >
      {sortedWidgets.map((widget) => {
        const widgetLayout = layout.find((l) => l.i === widget.id) ?? { i: widget.id, x: 0, y: 0, w: 6, h: 4 };

        return (
          <div key={widget.id} data-grid={widgetLayout} className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="drag-handle mb-2 w-fit rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 cursor-move">
              Drag
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
