"use client";

import type { DashboardSpec } from "@/types/spec";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";

interface DashboardWorkspaceProps {
  projectId: string;
  initialSpec: DashboardSpec;
}

export function DashboardWorkspace({ projectId, initialSpec }: DashboardWorkspaceProps) {
  return (
    <section>
      <DashboardRenderer projectId={projectId} spec={initialSpec} />
    </section>
  );
}
