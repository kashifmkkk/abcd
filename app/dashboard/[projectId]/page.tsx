import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { DashboardShell } from "@/components/generated-dashboard/DashboardShell";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDashboardPage({ params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, name: true, specJson: true },
  });

  if (!project) notFound();

  const spec = validateSpec(project.specJson);

  return (
    <DashboardShell
      spec={spec}
      projectId={project.id}
      projectName={project.name}
    >
      <DashboardWorkspace projectId={project.id} initialSpec={spec} />
    </DashboardShell>
  );
}
