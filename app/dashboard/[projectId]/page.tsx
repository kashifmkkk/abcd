import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateSpec } from "@/lib/validators/specValidator";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

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
    <main className="mx-auto max-w-7xl p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
        <p className="text-sm text-slate-500">Spec-driven dashboard with draggable widgets</p>
      </div>
      <DashboardWorkspace projectId={project.id} initialSpec={spec} />
    </main>
  );
}
