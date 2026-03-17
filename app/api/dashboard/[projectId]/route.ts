import { getCurrentUserId } from "@/lib/auth/session";
import { getDashboardCustomization, saveDashboardCustomization } from "@/lib/dashboard/customization";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { computeAllMetricsWithSeries } from "@/lib/metric-engine/metricEngine";
import { apiError, apiOk } from "@/lib/api/errors";
import { z } from "zod";

const LayoutItemSchema = z.object({
  i: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  minW: z.number().optional(),
  minH: z.number().optional(),
});

const SaveDashboardSchema = z.object({
  layout: z.object({
    columns: z.number().int().positive(),
    items: z.array(LayoutItemSchema),
  }),
  widgets: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["kpi", "chart", "table"]),
      title: z.string().min(1),
      description: z.string().optional(),
      metric: z.string().optional(),
      chartType: z.enum(["bar", "line", "pie", "area"]).optional(),
      metricX: z.string().optional(),
      metrics: z.array(z.string()).optional(),
      entity: z.string().optional(),
      config: z.object({
        xAxis: z.string().optional(),
        yAxis: z.string().optional(),
        aggregation: z.enum(["count", "sum", "avg", "min", "max"]).optional(),
        groupBy: z.string().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }).optional(),
    })
  ),
});

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

  const filters = parseDashboardFilters(new URL(_.url).searchParams);
  const customization = await getDashboardCustomization(project.id, spec);

  const computedMetrics = await computeAllMetricsWithSeries(project.id, spec, filters);

  const entityPreviewsEntries = await Promise.all(
    spec.entities.map(async (entity) => {
      const [rows, total] = await Promise.all([
        prisma.dashboardData.findMany({
          where: { projectId: project.id, entity: entity.name },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.dashboardData.count({
          where: { projectId: project.id, entity: entity.name },
        }),
      ]);

      return [
        entity.name,
        {
          total,
          records: rows,
        },
      ] as const;
    })
  );

  return apiOk({
    widgets: customization.widgets,
    layout: customization.layout,
    filterOptions: customization.filterOptions,
    computedMetrics,
    entityPreviews: Object.fromEntries(entityPreviewsEntries),
  });
}

export async function PUT(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  const { projectId } = await params;

  let parsedBody: z.infer<typeof SaveDashboardSchema>;
  try {
    const body = await req.json();
    const parsed = SaveDashboardSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", "Invalid dashboard payload", parsed.error.issues);
    }
    parsedBody = parsed.data;
  } catch (error) {
    return apiError(400, "INVALID_JSON", "Invalid JSON body", error);
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!project) return apiError(404, "NOT_FOUND", "Project not found");

  const layoutIds = new Set(parsedBody.layout.items.map((item) => item.i));
  const widgetIds = new Set(parsedBody.widgets.map((widget) => widget.id));

  for (const item of layoutIds) {
    if (!widgetIds.has(item)) {
      return apiError(422, "BAD_REQUEST", "Layout contains unknown widget IDs");
    }
  }

  await saveDashboardCustomization(project.id, parsedBody);

  return apiOk({ saved: true });
}
