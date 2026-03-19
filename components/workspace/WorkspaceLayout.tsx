"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { WorkspaceRightPanel, type WorkspacePanelKind } from "@/components/workspace/WorkspaceRightPanel";
import type { WorkspaceProject } from "@/components/workspace/DashboardHistoryGrid";

interface WorkspaceLayoutProps {
  kind: WorkspacePanelKind;
  projects: WorkspaceProject[];
  children: React.ReactNode;
}

export function WorkspaceLayout({ kind, projects, children }: WorkspaceLayoutProps) {
  return (
    <main className="w-full bg-slate-50 dark:bg-zinc-900">
      <div className="mx-auto w-full max-w-470 p-4 md:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Workspace</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu size={16} />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-4">
            <SheetHeader className="px-0">
              <SheetTitle>Workspace</SheetTitle>
            </SheetHeader>
            <WorkspaceSidebar projects={projects} className="mt-2" />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        <WorkspaceSidebar projects={projects} className="hidden w-65 shrink-0 lg:block" />

        <div className="min-w-0 flex-1">
          {children}
        </div>

        <aside className="hidden w-80 shrink-0 xl:block">
          <WorkspaceRightPanel kind={kind} projects={projects} />
        </aside>
      </div>
      </div>
    </main>
  );
}
