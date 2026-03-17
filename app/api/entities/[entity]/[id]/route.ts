import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { updateRecord, deleteRecord } from "@/lib/crud-engine/crudEngine";
import { getEntity } from "@/lib/spec-engine/entityRegistry";
import { validateEntityPayload } from "@/lib/crud-engine/entityValidator";
import { apiError, apiOk } from "@/lib/api/errors";

const QuerySchema = z.object({
  projectId: z.string().min(1),
});

interface Params {
  params: Promise<{ entity: string; id: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { entity, id } = await params;
  const body = await req.json();
  const parsed = QuerySchema.safeParse({ projectId: body.projectId });

  if (!parsed.success) {
    return apiError(400, "BAD_REQUEST", "projectId is required");
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId },
    select: { id: true, specJson: true },
  });
  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  let spec;
  try {
    spec = validateSpec(project.specJson);
  } catch (error) {
    return apiError(422, "INVALID_SPEC", "Invalid project spec", error);
  }

  const entityDef = getEntity(spec, entity);
  if (!entityDef) return apiError(404, "MISSING_ENTITY", `Entity ${entity} not in spec`);

  const validated = validateEntityPayload(entityDef, body.data as Record<string, unknown>);
  if (!validated.ok) {
    return apiError(422, "INVALID_FIELD", "Validation failed", validated.issues);
  }

  const updated = await updateRecord(project.id, entityDef.name, id, validated.data);
  if (!updated) return apiError(404, "NOT_FOUND", "Record not found");

  return apiOk(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { entity, id } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ projectId: searchParams.get("projectId") });

  if (!parsed.success) {
    return apiError(400, "BAD_REQUEST", "projectId is required");
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId },
    select: { id: true },
  });
  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  const deleted = await deleteRecord(project.id, entity, id);
  if (!deleted) return apiError(404, "NOT_FOUND", "Record not found");

  return apiOk(deleted);
}
