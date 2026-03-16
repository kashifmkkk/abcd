import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/errors";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec, safeValidateSpec } from "@/lib/validators/specValidator";
import { modifyDashboardSpecWithPrompt } from "@/lib/ai/dashboardModifier";

const ModifyDashboardSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(3, "Prompt must be at least 3 characters"),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  try {
    const body = await req.json();
    const parsed = ModifyDashboardSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const { projectId, prompt } = parsed.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, specJson: true },
    });

    if (!project) {
      return apiError(404, "NOT_FOUND", "Project not found");
    }

    const existingSpec = validateSpec(project.specJson);
    const { spec: nextSpec, changes } = await modifyDashboardSpecWithPrompt(existingSpec, prompt);

    const validated = safeValidateSpec(nextSpec);
    if (!validated.success) {
      return apiError(422, "INVALID_SPEC", "AI-generated spec is invalid", validated.error.issues);
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { specJson: validated.data as unknown as object },
      select: { id: true },
    });

    return apiOk({
      projectId,
      spec: validated.data,
      changes,
      message: "Dashboard updated with AI",
    });
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Failed to modify dashboard", error);
  }
}
