import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { computeMetric, computeMetricSeries } from "@/lib/metric-engine/metricEngine";
import { apiError, apiOk } from "@/lib/api/errors";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, specJson: true },
  });

  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  let spec;
  try {
    spec = validateSpec(project.specJson);
  } catch (error) {
    return apiError(422, "INVALID_SPEC", "Invalid project spec", error);
  }

  const metricEntries = await Promise.all(
    spec.metrics.map(async (metric) => {
      const [value, series] = await Promise.all([
        computeMetric(project.id, metric),
        computeMetricSeries(project.id, metric),
      ]);

      return [
        metric.name,
        {
          value: value.value,
          series,
        },
      ] as const;
    })
  );

  const entityPreviewsEntries = await Promise.all(
    spec.entities.map(async (entity) => {
      const rows = await prisma.dashboardData.findMany({
        where: { projectId: project.id, entity: entity.name },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return [
        entity.name,
        {
          total: rows.length,
          records: rows,
        },
      ] as const;
    })
  );

  return apiOk({
    widgets: spec.widgets,
    computedMetrics: Object.fromEntries(metricEntries),
    entityPreviews: Object.fromEntries(entityPreviewsEntries),
  });
}
