"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DashboardWidgetModel } from "@/types/dashboard";
import type { EntityDef, MetricOperation } from "@/types/spec";

interface AddWidgetDialogProps {
  open: boolean;
  entities: EntityDef[];
  onOpenChange: (open: boolean) => void;
  onCreate: (widget: DashboardWidgetModel) => void;
}

type NewWidgetType = "kpi" | "chart" | "table";

const AGGREGATIONS: MetricOperation[] = ["count", "sum", "avg", "min", "max"];

interface DraftState {
  title: string;
  type: NewWidgetType;
  entity?: string;
  xAxis?: string;
  yAxis?: string;
  aggregation: MetricOperation;
}

function buildInitialDraft(entities: EntityDef[]): DraftState {
  const entity = entities[0];
  return {
    title: "New widget",
    type: "chart",
    entity: entity?.name,
    xAxis: entity?.fields[0]?.name,
    yAxis: entity?.fields[1]?.name ?? entity?.fields[0]?.name,
    aggregation: "sum",
  };
}

export function AddWidgetDialog({ open, entities, onOpenChange, onCreate }: AddWidgetDialogProps) {
  const [draft, setDraft] = useState<DraftState>(() => buildInitialDraft(entities));

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setDraft(buildInitialDraft(entities));
      });
    }
  }, [entities, open]);

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.name === draft.entity),
    [draft.entity, entities]
  );

  const fieldOptions = selectedEntity?.fields ?? [];

  function createWidget() {
    const id = `widget_${crypto.randomUUID().slice(0, 8)}`;
    const widget: DashboardWidgetModel = {
      id,
      title: draft.title,
      type: draft.type,
      entity: draft.entity,
      chartType: draft.type === "chart" ? "bar" : undefined,
      metricX: draft.xAxis,
      metrics: draft.yAxis ? [draft.yAxis] : undefined,
      config: {
        xAxis: draft.xAxis,
        yAxis: draft.yAxis,
        aggregation: draft.aggregation,
        groupBy: draft.xAxis,
      },
    };

    onCreate(widget);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-60 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add widget</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create a new dashboard widget and choose how it should aggregate your data.
          </Dialog.Description>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-widget-title">Title</Label>
              <Input
                id="add-widget-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-widget-type">Widget type</Label>
                <select
                  id="add-widget-type"
                  title="Widget type"
                  aria-label="Widget type"
                  value={draft.type}
                  onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as NewWidgetType }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="kpi">Metric</option>
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-widget-entity">Entity</Label>
                <select
                  id="add-widget-entity"
                  title="Entity"
                  aria-label="Entity"
                  value={draft.entity ?? ""}
                  onChange={(event) => {
                    const nextEntity = entities.find((entity) => entity.name === event.target.value);
                    setDraft((prev) => ({
                      ...prev,
                      entity: event.target.value || undefined,
                      xAxis: nextEntity?.fields[0]?.name,
                      yAxis: nextEntity?.fields[1]?.name ?? nextEntity?.fields[0]?.name,
                    }));
                  }}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {entities.map((entity) => (
                    <option key={entity.name} value={entity.name}>
                      {entity.label ?? entity.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-widget-x-axis">X axis</Label>
                <select
                  id="add-widget-x-axis"
                  title="X axis"
                  aria-label="X axis"
                  value={draft.xAxis ?? ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, xAxis: event.target.value || undefined }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {fieldOptions.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.label ?? field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-widget-y-axis">Y axis</Label>
                <select
                  id="add-widget-y-axis"
                  title="Y axis"
                  aria-label="Y axis"
                  value={draft.yAxis ?? ""}
                  onChange={(event) => setDraft((prev) => ({ ...prev, yAxis: event.target.value || undefined }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {fieldOptions.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.label ?? field.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-widget-aggregation">Aggregation</Label>
              <select
                id="add-widget-aggregation"
                title="Aggregation"
                aria-label="Aggregation"
                value={draft.aggregation}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, aggregation: event.target.value as MetricOperation }))
                }
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {AGGREGATIONS.map((aggregation) => (
                  <option key={aggregation} value={aggregation}>
                    {aggregation.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button onClick={createWidget}>
              <Plus size={14} />
              Add widget
            </Button>
          </div>

          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100">
            <X size={16} />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}