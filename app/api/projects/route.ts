import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { generateSpecFromPrompt } from "@/lib/ai/specGenerator";
import { safeValidateSpec } from "@/lib/validators/specValidator";
import { apiError } from "@/lib/api/errors";

const CreateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  try {
    const body = await req.json();
    const parsed = CreateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(400, "BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const { prompt, name } = parsed.data;

    const generatedSpec = await generateSpecFromPrompt(prompt);
    const validated = safeValidateSpec(generatedSpec);

    if (!validated.success) {
      return apiError(422, "INVALID_SPEC", "Generated spec is invalid", validated.error.issues);
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name: name ?? validated.data.app.name ?? "Untitled Dashboard",
        specJson: validated.data as unknown as object,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}
