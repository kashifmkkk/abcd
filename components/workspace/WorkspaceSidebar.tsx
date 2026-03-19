"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const recent = projects.slice(0, 6);

  function itemClasses(href: string) {
    const active = pathname === href || (href === "/dashboard" && pathname.startsWith("/dashboard/"));
    if (active) {
      return "flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-700 dark:bg-zinc-800 dark:text-amber-400";
    }

    return "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white";
  }

  return (
    <aside className={className}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/create" onClick={onNavigate}>
            <Plus size={16} />
            New Dashboard
          </Link>
        </Button>

        <div className="mt-6 space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Workspace
          </p>

          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={itemClasses("/dashboard")}
          >
            <LayoutDashboard size={16} />
            New Dashboard
          </Link>

          <Link
            href="/upload"
            onClick={onNavigate}
            className={itemClasses("/upload")}
          >
            <Upload size={16} />
            Upload CSV
          </Link>

          <Link
            href="/create"
            onClick={onNavigate}
            className={itemClasses("/create")}
          >
            <Sparkles size={16} />
            AI Suggestions
          </Link>

          <Link
            href="/settings"
            onClick={onNavigate}
            className={itemClasses("/settings")}
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>

        <div className="mt-6 space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Recent Dashboards
          </p>

          <div className="space-y-1">
            {recent.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500 dark:text-zinc-400">
                No dashboards yet.
              </p>
            ) : (
              recent.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/${project.id}`}
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{project.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
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
