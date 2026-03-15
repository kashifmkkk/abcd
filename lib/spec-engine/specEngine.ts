/**
 * Spec Engine – utilities for reading and resolving the DashboardSpec.
 *
 * Provides helper functions consumed by API routes and the dashboard renderer
 * to look up entities, metrics, and widgets by name/id.
 */
import type { DashboardSpec, EntityDef, MetricDef, WidgetDef } from "@/types/spec";

/** Get an entity definition by name (case-insensitive). */
export function getEntity(spec: DashboardSpec, name: string): EntityDef | undefined {
  return spec.entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
}

/** Get a metric definition by name. */
export function getMetric(spec: DashboardSpec, name: string): MetricDef | undefined {
  return spec.metrics.find((m) => m.name === name);
}

/** Get a widget definition by id. */
export function getWidget(spec: DashboardSpec, id: string): WidgetDef | undefined {
  return spec.widgets.find((w) => w.id === id);
}

/** Return all field names for an entity. */
export function getFieldNames(spec: DashboardSpec, entityName: string): string[] {
  const entity = getEntity(spec, entityName);
  return entity ? entity.fields.map((f) => f.name) : [];
}

/**
 * Build the default layout items for widgets that do not yet have a
 * layout entry, stacking them vertically.
 */
export function buildDefaultLayout(spec: DashboardSpec): DashboardSpec["layout"]["items"] {
  const existing = new Set(spec.layout.items.map((i) => i.i));
  const extra = spec.widgets
    .filter((w) => !existing.has(w.id))
    .map((w, idx) => ({
      i: w.id,
      x: 0,
      y: (spec.layout.items.length + idx) * 4,
      w: 12,
      h: 4,
    }));
  return [...spec.layout.items, ...extra];
}
