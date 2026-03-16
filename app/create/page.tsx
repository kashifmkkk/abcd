import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { CreatePromptBuilder } from "@/components/workspace/CreatePromptBuilder";

export default async function CreateDashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  const serializedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt.toISOString(),
  }));

  return (
    <WorkspaceLayout kind="create" projects={serializedProjects}>
      <CreatePromptBuilder />
    </WorkspaceLayout>
  );
}
