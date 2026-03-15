import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { CreateDashboardForm } from "@/components/forms/CreateDashboardForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardListPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const projects: Array<{ id: string; name: string; updatedAt: Date }> = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true },
  });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Your Dashboards</h1>

      <CreateDashboardForm />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-500">Updated: {project.updatedAt.toLocaleString()}</p>
              <Link href={`/dashboard/${project.id}`} className="text-sm font-medium text-slate-900 underline">
                Open dashboard
              </Link>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-slate-500">
              No dashboards yet. Create one using a prompt above.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
