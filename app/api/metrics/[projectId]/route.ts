import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { computeMetric, computeMetricSeries } from "@/lib/metric-engine/metricEngine";

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

  if (!metricName) {
    return NextResponse.json({ error: "Metric required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, specJson: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const spec = validateSpec(project.specJson);
  const metricDef = spec.metrics.find((metric) => metric.name === metricName);

  if (!metricDef) {
    return NextResponse.json({ error: "Metric not found" }, { status: 404 });
  }

  const [value, series] = await Promise.all([
    computeMetric(project.id, metricDef, spec),
    computeMetricSeries(project.id, metricDef, spec),
  ]);

  return NextResponse.json({
    metric: metricName,
    value: value.value,
    series,
  });
}
