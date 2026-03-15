import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { safeValidateSpec } from "@/lib/validators/specValidator";

interface Params {
  params: Promise<{ projectId: string }>;
}

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  specJson: z.unknown().optional(),
});

export async function GET(_: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      name: true,
      specJson: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}

export async function PUT(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const updateData: { name?: string; specJson?: object } = {};

    if (parsed.data.name) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.specJson !== undefined) {
      const validated = safeValidateSpec(parsed.data.specJson);
      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: "Invalid spec", issues: validated.error.issues },
          { status: 422 }
        );
      }
      updateData.specJson = validated.data as unknown as object;
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      select: {
        id: true,
        name: true,
        specJson: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: project });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}
