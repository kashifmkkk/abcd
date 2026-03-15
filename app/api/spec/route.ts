import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { safeValidateSpec } from "@/lib/validators/specValidator";

const QuerySchema = z.object({
  projectId: z.string().min(1),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ projectId: searchParams.get("projectId") });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, userId },
    select: { specJson: true },
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const validated = safeValidateSpec(project.specJson);
  if (!validated.success) {
    return NextResponse.json({ success: false, error: "Stored spec is invalid" }, { status: 422 });
  }

  return NextResponse.json({ success: true, data: validated.data });
}
