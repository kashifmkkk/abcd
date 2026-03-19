import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { parseDashboardFilters, applyDashboardFilters } from "@/lib/dashboard/filters";
import { classifyAllColumns } from "@/lib/ai/columnClassifier";
import { generateInsights } from "@/lib/ai/insightsEngine";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasFilters = ["dateFrom", "dateTo", "category", "region", "status"]
    .some((key) => req.nextUrl.searchParams.has(key));
  const cacheHeader = hasFilters
    ? "no-store"
    : "public, s-maxage=60, stale-while-revalidate=300";

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, specJson: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const spec = validateSpec(project.specJson);
  const filters = parseDashboardFilters(req.nextUrl.searchParams);

  // Load all entity rows
  const entityRows: Record<string, Array<Record<string, string>>> = {};
  await Promise.all(
    spec.entities.map(async (entity) => {
      const rows = await prisma.dashboardData.findMany({
        where: { projectId: project.id, entity: entity.name },
        select: { data: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const filtered = applyDashboardFilters(
        rows.map((r) => ({ data: r.data as Record<string, unknown>, createdAt: r.createdAt })),
        filters,
      );

      entityRows[entity.name] = filtered.map((r) => {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(r.data)) {
          if (value == null) {
            normalized[key] = "";
          } else if (typeof value === "string") {
            normalized[key] = value;
          } else if (typeof value === "number" || typeof value === "boolean") {
            normalized[key] = String(value);
          } else if (value instanceof Date) {
            normalized[key] = value.toISOString();
          } else {
            normalized[key] = String(value);
          }
        }
        return normalized;
      });
    }),
  );

  const flattenedRows = Object.values(entityRows).flat();
  const columns = classifyAllColumns(flattenedRows);
  const insights = generateInsights(columns, flattenedRows);

  return NextResponse.json(
    { success: true, data: insights },
    { headers: { "Cache-Control": cacheHeader } }
  );
}
