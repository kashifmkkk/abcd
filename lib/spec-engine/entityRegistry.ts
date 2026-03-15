import type { DashboardSpec, EntityDef } from "@/types/spec";

export function getEntity(spec: DashboardSpec, entityName: string): EntityDef | undefined {
  return spec.entities.find(
    (entity) => entity.name.toLowerCase() === entityName.toLowerCase()
  );
}

export function requireEntity(spec: DashboardSpec, entityName: string): EntityDef {
  const entity = getEntity(spec, entityName);
  if (!entity) {
    throw new Error(`Entity not found in spec: ${entityName}`);
  }
  return entity;
}

export function listEntities(spec: DashboardSpec): EntityDef[] {
  return spec.entities;
}
