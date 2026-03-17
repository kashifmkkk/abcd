import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WorkspaceProject } from "@/components/workspace/DashboardHistoryGrid";

export type WorkspacePanelKind = "dashboard" | "create" | "upload" | "project" | "settings";

interface WorkspaceRightPanelProps {
  kind: WorkspacePanelKind;
  projects: WorkspaceProject[];
}

export function WorkspaceRightPanel({ kind, projects }: WorkspaceRightPanelProps) {
  if (kind === "create") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Sales analytics dashboard",
              "Marketing performance dashboard",
              "Inventory tracking dashboard",
              "User growth dashboard",
            ].map((prompt) => (
              <p key={prompt} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {prompt}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kind === "upload") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSV Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Use clear column names for best AI mapping.</p>
            <p>Keep date fields in ISO format when possible.</p>
            <p>Ensure numeric columns contain valid values.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supported Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>CSV</p>
            <p>Excel (.xlsx) preview guidance</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kind === "settings") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Keep your display name consistent across shared dashboards.</p>
            <p>Use organization and role to improve AI workspace context.</p>
            <p>Switch theme preferences to match your environment.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Dashboards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${project.id}`}
                className="block rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{project.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(project.updatedAt).toLocaleDateString("en-CA")}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.slice(0, 10).map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/${project.id}`}
              className="block rounded-lg border border-slate-200 p-2.5 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{project.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {new Date(project.updatedAt).toLocaleString("en-CA")}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/upload">Upload CSV</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/create">AI Prompt Builder</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
