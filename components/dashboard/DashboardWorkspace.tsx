"use client";

import { useState } from "react";
import type { DashboardSpec } from "@/types/spec";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";

interface DashboardWorkspaceProps {
  projectId: string;
  initialSpec: DashboardSpec;
}

export function DashboardWorkspace({ projectId, initialSpec }: DashboardWorkspaceProps) {
  const [spec, setSpec] = useState<DashboardSpec>(initialSpec);

  return (
    <section>
      <DashboardRenderer projectId={projectId} spec={spec} />
    </section>
  );
}
