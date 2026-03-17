"use client";

import Link from "next/link";
import { Plus, Sparkles, Upload, LayoutDashboard, Clock3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface WorkspaceSidebarProps {
  projects: WorkspaceProject[];
  className?: string;
  onNavigate?: () => void;
}

export function WorkspaceSidebar({ projects, className, onNavigate }: WorkspaceSidebarProps) {
  const recent = projects.slice(0, 6);

  return (
    <aside className={className}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/create" onClick={onNavigate}>
            <Plus size={16} />
            New Dashboard
          </Link>
        </Button>

        <div className="mt-6 space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Workspace
          </p>

          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LayoutDashboard size={16} />
            New Dashboard
          </Link>

          <Link
            href="/upload"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Upload size={16} />
            Upload CSV
          </Link>

          <Link
            href="/create"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Sparkles size={16} />
            AI Suggestions
          </Link>

          <Link
            href="/settings"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>

        <div className="mt-6 space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Recent Dashboards
          </p>

          <div className="space-y-1">
            {recent.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                No dashboards yet.
              </p>
            ) : (
              recent.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/${project.id}`}
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{project.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock3 size={12} />
                    {new Date(project.updatedAt).toLocaleDateString("en-CA")}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
