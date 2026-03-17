import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { computeAllMetrics, computeChartData } from "@/lib/metric-engine/metricEngine";
import { getEntity } from "@/lib/spec-engine/entityRegistry";
import { apiError, apiOk } from "@/lib/api/errors";

const QuerySchema = z.object({
  projectId: z.string().min(1),
  entity: z.string().optional(),
  metricX: z.string().optional(),
  fields: z.string().optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    projectId: searchParams.get("projectId"),
    entity: searchParams.get("entity") ?? undefined,
    metricX: searchParams.get("metricX") ?? undefined,
    fields: searchParams.get("fields") ?? undefined,
  });

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

  const filters = parseDashboardFilters(searchParams);

  if (parsed.data.entity && parsed.data.metricX && parsed.data.fields) {
    const entity = getEntity(spec, parsed.data.entity);
    if (!entity) {
      return apiError(404, "MISSING_ENTITY", `Entity ${parsed.data.entity} not found in spec`);
    }

    const fields = parsed.data.fields.split(",").map((s) => s.trim()).filter(Boolean);
    const invalidField = fields.find((field) => !entity.fields.some((ef) => ef.name === field));
    if (invalidField) {
      return apiError(422, "INVALID_METRIC", `Field ${invalidField} does not exist in entity ${entity.name}`);
    }

    const chart = await computeChartData(project.id, parsed.data.entity, parsed.data.metricX, fields, filters);
    return apiOk(chart);
  }

  const metrics = await computeAllMetrics(project.id, spec, filters);
  return apiOk(metrics);
}
