import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { applyDashboardFilters, parseDashboardFilters } from "@/lib/dashboard/filters";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { createRecord } from "@/lib/crud-engine/crudEngine";
import { getEntity } from "@/lib/spec-engine/entityRegistry";
import { validateEntityPayload } from "@/lib/crud-engine/entityValidator";
import { apiError, apiOk } from "@/lib/api/errors";

const QuerySchema = z.object({
  projectId: z.string().min(1),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
});

interface Params {
  params: Promise<{ entity: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { entity } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    projectId: searchParams.get("projectId"),
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return apiError(400, "BAD_REQUEST", "projectId is required");
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId },
    select: { id: true },
  });
  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  const filters = parseDashboardFilters(searchParams);
  const { page, pageSize } = parsed.data;

  const [rows, total] = await Promise.all([
    prisma.dashboardData.findMany({
      where: { projectId: project.id, entity },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dashboardData.count({
      where: { projectId: project.id, entity },
    }),
  ]);

  const records = applyDashboardFilters(
    rows.map((row) => ({
      ...row,
      data: row.data as Record<string, unknown>,
    })),
    filters
  );

  return apiOk({ records, page, pageSize, total });
}

export async function POST(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { entity } = await params;
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

  if (!entityDef) {
    return apiError(404, "MISSING_ENTITY", `Entity ${entity} not in spec`);
  }

  const payload = body.data as Record<string, unknown>;
  const validated = validateEntityPayload(entityDef, payload ?? {});

  if (!validated.ok) {
    return apiError(422, "INVALID_FIELD", "Validation failed", validated.issues);
  }

  const created = await createRecord(project.id, entityDef.name, validated.data);
  return apiOk(created, 201);
}
