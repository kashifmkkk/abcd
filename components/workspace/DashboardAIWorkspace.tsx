"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Upload,
  BarChart3,
  Database,
  BookOpen,
  WandSparkles,
} from "lucide-react";
import { DashboardHistoryGrid, type WorkspaceProject } from "@/components/workspace/DashboardHistoryGrid";

interface DashboardAIWorkspaceProps {
  projects: WorkspaceProject[];
  projectsLoading?: boolean;
}

const QUICK_ACTIONS = [
  {
    icon: Sparkles,
    title: "Create dashboard from prompt",
    description: "Describe what you need and generate a full dashboard instantly.",
    prompt: "Create a sales analytics dashboard with KPI cards, trend charts, and top products table.",
  },
  {
    icon: Upload,
    title: "Upload CSV data",
    description: "Import your dataset and auto-generate entities and metrics.",
    href: "/upload",
  },
  {
    icon: BarChart3,
    title: "Generate analytics",
    description: "Build an executive analytics workspace with grouped insights.",
    prompt: "Generate an executive analytics dashboard with monthly trends and conversion funnel.",
  },
  {
    icon: Database,
    title: "Import dataset",
    description: "Start from existing business data and map key fields quickly.",
    href: "/upload",
  },
] as const;

const EXAMPLE_PROMPTS = [
  "Sales analytics dashboard",
  "Marketing performance dashboard",
  "Inventory tracking dashboard",
  "User growth dashboard",
];

export function DashboardAIWorkspace({ projects, projectsLoading = false }: DashboardAIWorkspaceProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [projects]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 5) {
      setError("Prompt must be at least 5 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompt }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? json?.error ?? "Failed to create dashboard");
        return;
      }

      router.push(`/dashboard/${json.data.id}`);
      router.refresh();
    } catch {
      setError("Failed to create dashboard");
    } finally {
      setLoading(false);
    }
  };

  const improvePrompt = () => {
    setPrompt((prev) => {
      const base = prev.trim();
      if (!base) {
        return "Create a modern dashboard with KPI cards, monthly trend charts, and an insights table.";
      }
      if (base.toLowerCase().includes("kpi") && base.toLowerCase().includes("trend")) {
        return base;
      }
      return `${base} Include KPI cards, monthly trend visualizations, and a breakdown table.`;
    });
  };

  return (
    <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hi there!</h1>
          <p className="text-slate-500 dark:text-zinc-400">What dashboard would you like to create?</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;

            if ("href" in action) {
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  whileHover={{ y: -3 }}
                >
                  <Link href={action.href} className="block">
                    <Card className="h-full cursor-pointer border-slate-200 transition-all hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-amber-500/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-500">
                            <Icon size={16} />
                          </span>
                          {action.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            }

            return (
              <motion.button
                key={action.title}
                type="button"
                onClick={() => setPrompt(action.prompt)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
                whileHover={{ y: -3 }}
                className="text-left"
              >
                <Card className="h-full border-slate-200 transition-all hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:hover:border-amber-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-500">
                        <Icon size={16} />
                      </span>
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">{action.description}</p>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dashboard name (optional)"
          />

          <Textarea
            required
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the dashboard you want to generate..."
          />

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800">
            <Button asChild variant="outline" size="sm">
              <Link href="/upload">
                <Upload size={14} />
                Upload CSV
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPromptLibrary((prev) => !prev)}
            >
              <BookOpen size={14} />
              Prompt library
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={improvePrompt}>
              <WandSparkles size={14} />
              Improve prompt
            </Button>

            <div className="ml-auto">
              <Button type="submit" disabled={loading || prompt.trim().length < 5}>
                {loading ? "Generating..." : "Create dashboard"}
              </Button>
            </div>
          </div>

          {showPromptLibrary ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                Prompt library
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Build a retail dashboard with category sales and stock alerts.",
                  "Create a marketing dashboard with campaign ROI and CAC trends.",
                  "Generate a finance dashboard with monthly revenue and burn rate.",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p> : null}
        </motion.form>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard History</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {projectsLoading ? "Loading dashboards..." : `${sortedProjects.length} total dashboards`}
            </p>
          </div>
          <DashboardHistoryGrid projects={sortedProjects} isLoading={projectsLoading} />
        </section>
    </section>
  );
}
