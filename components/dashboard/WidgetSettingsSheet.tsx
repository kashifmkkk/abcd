"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DashboardWidgetModel } from "@/types/dashboard";
import type { EntityDef, MetricOperation } from "@/types/spec";

interface WidgetSettingsSheetProps {
  open: boolean;
  widget: DashboardWidgetModel | null;
  entities: EntityDef[];
  onOpenChange: (open: boolean) => void;
  onSave: (widget: DashboardWidgetModel) => void;
}

const AGGREGATIONS: MetricOperation[] = ["count", "sum", "avg", "min", "max"];

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
}) {
  return (
    <select
      id={id}
      title={placeholder}
      aria-label={placeholder}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function WidgetSettingsSheet({
  open,
  widget,
  entities,
  onOpenChange,
  onSave,
}: WidgetSettingsSheetProps) {
  const [draft, setDraft] = useState<DashboardWidgetModel | null>(widget);

  useEffect(() => {
    setDraft(widget);
  }, [widget]);

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.name === draft?.entity),
    [draft?.entity, entities]
  );

  const fieldOptions = useMemo(
    () => (selectedEntity?.fields ?? []).map((field) => ({ label: field.label ?? field.name, value: field.name })),
    [selectedEntity]
  );

  const entityOptions = useMemo(
    () => entities.map((entity) => ({ label: entity.label ?? entity.name, value: entity.name })),
    [entities]
  );

  const saveDisabled = !draft?.title.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-120">
        <SheetHeader>
          <SheetTitle>Widget settings</SheetTitle>
          <SheetDescription>
            Configure data mapping, aggregation, and grouping for the selected widget.
          </SheetDescription>
        </SheetHeader>

        {draft ? (
          <div className="flex h-[calc(100%-88px)] flex-col gap-5 overflow-y-auto px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-description">Description</Label>
              <Textarea
                id="widget-description"
                value={draft.description ?? ""}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, description: event.target.value || undefined } : prev))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-entity">Entity</Label>
              <SelectField
                id="widget-entity"
                value={draft.entity}
                onChange={(value) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          entity: value || undefined,
                          config: {
                            ...prev.config,
                            xAxis: undefined,
                            yAxis: undefined,
                            groupBy: undefined,
                          },
                        }
                      : prev
                  )
                }
                options={entityOptions}
                placeholder="Select entity"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="widget-x-axis">X axis</Label>
                <SelectField
                  id="widget-x-axis"
                  value={draft.config?.xAxis}
                  onChange={(value) =>
                    setDraft((prev) =>
                      prev
                        ? { ...prev, metricX: value || undefined, config: { ...prev.config, xAxis: value || undefined } }
                        : prev
                    )
                  }
                  options={fieldOptions}
                  placeholder="Select field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-y-axis">Y axis</Label>
                <SelectField
                  id="widget-y-axis"
                  value={draft.config?.yAxis}
                  onChange={(value) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            metrics: value ? [value] : undefined,
                            config: { ...prev.config, yAxis: value || undefined },
                          }
                        : prev
                    )
                  }
                  options={fieldOptions}
                  placeholder="Select field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="widget-aggregation">Aggregation</Label>
                <SelectField
                  id="widget-aggregation"
                  value={draft.config?.aggregation}
                  onChange={(value) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            config: {
                              ...prev.config,
                              aggregation: (value || undefined) as MetricOperation | undefined,
                            },
                          }
                        : prev
                    )
                  }
                  options={AGGREGATIONS.map((aggregation) => ({ label: aggregation.toUpperCase(), value: aggregation }))}
                  placeholder="Select aggregation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-group-by">Group by</Label>
                <SelectField
                  id="widget-group-by"
                  value={draft.config?.groupBy}
                  onChange={(value) =>
                    setDraft((prev) =>
                      prev ? { ...prev, config: { ...prev.config, groupBy: value || undefined } } : prev
                    )
                  }
                  options={fieldOptions}
                  placeholder="Select field"
                />
              </div>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={saveDisabled}
                onClick={() => {
                  if (!draft) return;
                  onSave(draft);
                }}
              >
                Apply settings
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}