/**
 * Dynamic CRUD Engine.
 *
 * Reads entity definitions from a DashboardSpec and provides generic
 * create / read / update / delete operations backed by the DashboardData table.
 *
 * Each record is stored as a JSONB blob in DashboardData.data together
 * with projectId and entity name, so one table serves all entities.
 */
import { prisma } from "@/lib/db/client";

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/** CREATE a new record for an entity */
export async function createRecord(
  projectId: string,
  entity: string,
  payload: Record<string, unknown>
) {
  return prisma.dashboardData.create({
    data: {
      projectId,
      entity,
      data: payload as unknown as object,
    },
  });
}

/** READ all records for an entity in a project */
export async function getRecords(projectId: string, entity: string) {
  return prisma.dashboardData.findMany({
    where: { projectId, entity },
    orderBy: { createdAt: "desc" },
  });
}

export const listRecords = getRecords;

/** READ a single record by id */
export async function getRecord(
  projectId: string,
  entity: string,
  id: string
) {
  return prisma.dashboardData.findFirst({
    where: { id, projectId, entity },
  });
}

/** UPDATE a record */
export async function updateRecord(
  projectId: string,
  entity: string,
  id: string,
  payload: Record<string, unknown>
) {
  // Verify ownership before updating
  const existing = await getRecord(projectId, entity, id);
  if (!existing) return null;

  return prisma.dashboardData.update({
    where: { id },
    data: { data: payload as unknown as object },
  });
}

/** DELETE a record */
export async function deleteRecord(
  projectId: string,
  entity: string,
  id: string
) {
  const existing = await getRecord(projectId, entity, id);
  if (!existing) return null;

  return prisma.dashboardData.delete({ where: { id } });
}
