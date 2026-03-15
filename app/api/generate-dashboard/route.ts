import { z } from "zod";
import { headers } from "next/headers";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { generateSpecFromPrompt } from "@/lib/ai/specGenerator";
import { apiError, apiOk } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/ai/rateLimit";

const GenerateDashboardSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const requestHeaders = await headers();
  const rateKey = requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("host") ?? userId;
  const rateLimit = checkRateLimit(`${userId}:${rateKey}`);
  if (!rateLimit.allowed) {
    return apiError(429, "RATE_LIMITED", "Too many generation requests", {
      resetInMs: rateLimit.resetInMs,
    });
  }

  try {
    const body = await req.json();
    const parsed = GenerateDashboardSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const spec = await generateSpecFromPrompt(parsed.data.prompt);
    const project = await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name ?? spec.app.name,
        specJson: spec as unknown as object,
      },
      select: { id: true, name: true, createdAt: true },
    });

    return apiOk({ projectId: project.id, project }, 201);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Failed to generate dashboard", error);
  }
}