import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { analyzeDashboard } from "@/lib/ai/dashboardAdvisor";
import { apiError, apiOk } from "@/lib/api/errors";

const AdvisorSchema = z.object({
  projectId: z.string().min(1),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError(401, "UNAUTHORIZED", "Unauthorized");

  let projectId = "";
  try {
    const body = await req.json();
    const parsed = AdvisorSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload");
    }
    projectId = parsed.data.projectId;
  } catch (error) {
    return apiError(400, "INVALID_JSON", "Invalid JSON body", error);
  }

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

  const suggestions = await analyzeDashboard(spec);
  return apiOk({ suggestions });
}
