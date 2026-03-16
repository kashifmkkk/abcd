import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/authConfig";
import { prisma } from "@/lib/db/client";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { SettingsWorkspace } from "@/components/workspace/SettingsWorkspace";

export default async function SettingsPage() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  const serializedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt.toISOString(),
  }));

  const email = session.user.email ?? "";
  const defaultDisplayName = email.split("@")[0] || "User";

  return (
    <WorkspaceLayout kind="settings" projects={serializedProjects}>
      <SettingsWorkspace
        email={email}
        defaultDisplayName={defaultDisplayName}
        projects={serializedProjects}
      />
    </WorkspaceLayout>
  );
}
