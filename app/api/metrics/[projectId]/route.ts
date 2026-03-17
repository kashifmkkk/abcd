import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { computeAggregateWidget, computeMetric, computeMetricSeries } from "@/lib/metric-engine/metricEngine";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const metricName = req.nextUrl.searchParams.get("metric");
  const entity = req.nextUrl.searchParams.get("entity");
  const aggregation = req.nextUrl.searchParams.get("aggregation");
  const field = req.nextUrl.searchParams.get("field") ?? undefined;
  const groupBy = req.nextUrl.searchParams.get("groupBy") ?? undefined;
  const filters = parseDashboardFilters(req.nextUrl.searchParams);

  if (!metricName && (!entity || !aggregation)) {
    return NextResponse.json({ error: "Metric or aggregation query required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, specJson: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const spec = validateSpec(project.specJson);

  if (!metricName && entity && aggregation) {
    const result = await computeAggregateWidget(project.id, {
      entity,
      aggregation: aggregation as "count" | "sum" | "avg" | "min" | "max",
      field,
      groupBy,
      filters,
    });

    return NextResponse.json({
      value: Math.round(result.value * 100) / 100,
      series: result.series,
      hasData: result.recordCount > 0,
      recordCount: result.recordCount,
    });
  }

  const metricDef = spec.metrics.find((metric) => metric.name === metricName);

  if (!metricDef) {
    return NextResponse.json({ error: "Metric not found" }, { status: 404 });
  }

  const [value, series] = await Promise.all([
    computeMetric(project.id, metricDef, spec, filters),
    computeMetricSeries(project.id, metricDef, spec, filters, groupBy),
  ]);

  const metricResult = await computeAggregateWidget(project.id, {
    entity: metricDef.entity,
    aggregation: metricDef.operation,
    field: metricDef.field,
    groupBy,
    filters,
  });

  return NextResponse.json({
    metric: metricName,
    value: value.value,
    series,
    hasData: metricResult.recordCount > 0,
    recordCount: metricResult.recordCount,
  });
}
