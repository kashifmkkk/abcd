"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface WorkspaceProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface DashboardHistoryGridProps {
  projects: WorkspaceProject[];
  isLoading?: boolean;
}

export function DashboardHistoryGrid({ projects, isLoading = false }: DashboardHistoryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={`history-skeleton-${idx}`} className="h-full">
            <CardHeader>
              <div className="h-5 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-zinc-700" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-slate-200 dark:bg-zinc-700" />
              <div className="h-10 w-full animate-pulse rounded-md border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500 dark:text-zinc-400">
          No dashboards yet. Create your first dashboard with AI.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project, idx) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.03 }}
          whileHover={{ y: -3 }}
        >
          <Card className="h-full transition-shadow hover:border-amber-400 hover:shadow-md dark:hover:border-amber-500/50">
            <CardHeader>
              <CardTitle className="line-clamp-2">{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Last updated: {new Date(project.updatedAt).toLocaleString("en-CA")}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/${project.id}`}>Open dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
