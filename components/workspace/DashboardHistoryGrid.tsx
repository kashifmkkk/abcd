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
}

export function DashboardHistoryGrid({ projects }: DashboardHistoryGridProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">
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
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="line-clamp-2">{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
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
