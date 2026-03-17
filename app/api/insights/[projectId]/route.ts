import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { parseDashboardFilters, applyDashboardFilters } from "@/lib/dashboard/filters";
import { generateInsightsFromSpec } from "@/lib/ai/insightsEngine";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const entityRows: Record<string, Array<Record<string, unknown>>> = {};
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

      entityRows[entity.name] = filtered.map((r) => r.data);
    }),
  );

  const insights = generateInsightsFromSpec(spec, entityRows);

  return NextResponse.json({ success: true, data: insights });
}
