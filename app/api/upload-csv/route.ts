import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { parseCsv } from "@/lib/csv/parseCsv";
import { analyzeCsvData } from "@/lib/ai/dataUnderstanding";
import { safeValidateSpec } from "@/lib/validators/specValidator";
import { apiError, apiOk } from "@/lib/api/errors";
import { computeAllMetrics } from "@/lib/metric-engine/metricEngine";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  try {
    const form = await req.formData();
    const file = form.get("file");
    const projectNameInput = form.get("name");

    if (!(file instanceof File)) {
      return apiError(400, "BAD_REQUEST", "CSV file is required");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return apiError(400, "BAD_REQUEST", "Only CSV files are supported");
    }

    const content = await file.text();
    const { headers, rows } = parseCsv(content);

    const analysis = await analyzeCsvData({
      fileName: file.name,
      headers,
      rows,
    });

    const validated = safeValidateSpec(analysis.spec);
    if (!validated.success) {
      return apiError(422, "INVALID_SPEC", "Generated spec from CSV is invalid", validated.error.issues);
    }

    const entityName = validated.data.entities[0]?.name;
    if (!entityName) {
      return apiError(422, "INVALID_SPEC", "Generated spec is missing entity");
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name:
          typeof projectNameInput === "string" && projectNameInput.trim().length > 0
            ? projectNameInput.trim()
            : validated.data.app.name,
        specJson: validated.data as unknown as object,
      },
      select: { id: true, name: true },
    });

    if (analysis.typedRows.length > 0) {
      await prisma.dashboardData.createMany({
        data: analysis.typedRows.map((row) => ({
          projectId: project.id,
          entity: entityName,
          data: row as unknown as object,
        })),
      });
    }

    // Force metric recomputation once import completes so first dashboard render has fresh values.
    await computeAllMetrics(project.id, validated.data);
    const refreshedAt = Date.now();

    return apiOk({
      projectId: project.id,
      projectName: project.name,
      rowsImported: analysis.typedRows.length,
      entity: entityName,
      refreshedAt,
    }, 201);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Failed to import CSV", error);
  }
}
