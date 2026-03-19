import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { parseCsv } from "@/lib/csv/parseCsv";
import { analyzeCsvAndBuildSpec } from "@/lib/ai/dataUnderstanding";
import { safeValidateSpec } from "@/lib/validators/specValidator";
import { apiError, apiOk } from "@/lib/api/errors";
import { computeAllMetrics } from "@/lib/metric-engine/metricEngine";
import type { FieldDef } from "@/types/spec";

function coerceByField(value: string, field: FieldDef): unknown {
  if (value.trim().length === 0) return null;

  if (field.type === "integer" || field.type === "float") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (field.type === "boolean") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }

  if (field.type === "datetime") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  return value;
}

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
    const { rows } = parseCsv(content);

    const rawProjectName = typeof projectNameInput === "string" && projectNameInput.trim().length > 0
      ? projectNameInput.trim()
      : file.name.replace(/\.[^/.]+$/, "");

    const generatedSpec = analyzeCsvAndBuildSpec(content, rawProjectName);

    const validated = safeValidateSpec(generatedSpec);
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
        name: rawProjectName || validated.data.app.name,
        specJson: validated.data as unknown as object,
      },
      select: { id: true, name: true },
    });

    const fields = validated.data.entities[0]?.fields ?? [];
    const typedRows = rows.map((row) => {
      const typed: Record<string, unknown> = {};
      for (const field of fields) {
        typed[field.name] = coerceByField(row[field.name] ?? "", field);
      }
      return typed;
    });

    if (typedRows.length > 0) {
      const CHUNK_SIZE = 500;
      const rowsToInsert = typedRows.map((row) => ({
        projectId: project.id,
        entity: entityName,
        data: row as unknown as object,
      }));

      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        await prisma.dashboardData.createMany({
          data: rowsToInsert.slice(i, i + CHUNK_SIZE),
        });
      }
    }

    // Force metric recomputation once import completes so first dashboard render has fresh values.
    await computeAllMetrics(project.id, validated.data);

    return apiOk({
      projectId: project.id,
      spec: validated.data,
      insights: validated.data.insights ?? [],
    }, 201);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Failed to import CSV", error);
  }
}
