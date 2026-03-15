"use client";

import { useState } from "react";
import type { DashboardSpec } from "@/types/spec";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { AISuggestions } from "@/components/dashboard/AISuggestions";

interface DashboardWorkspaceProps {
  projectId: string;
  initialSpec: DashboardSpec;
}

export function DashboardWorkspace({ projectId, initialSpec }: DashboardWorkspaceProps) {
  const [spec, setSpec] = useState<DashboardSpec>(initialSpec);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div>
        <DashboardRenderer projectId={projectId} spec={spec} />
      </div>
      <div>
        <AISuggestions projectId={projectId} spec={spec} onSpecUpdated={setSpec} />
      </div>
    </section>
  );
}
