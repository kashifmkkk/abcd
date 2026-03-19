"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, WandSparkles } from "lucide-react";

const SUGGESTED = [
  "Sales analytics dashboard",
  "Marketing performance dashboard",
  "Inventory tracking dashboard",
  "User growth dashboard",
];

export function CreatePromptBuilder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = async () => {
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
        body: JSON.stringify({ prompt: prompt.trim(), name: name.trim() || undefined }),
      });

      const json = await res.json();
      const projectId = json?.data?.id;

      if (!res.ok || !projectId) {
        setError(json?.error?.message ?? json?.error ?? "Failed to generate dashboard");
        return;
      }

      router.push(`/dashboard/${projectId}`);
    } catch {
      setError("Failed to generate dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Dashboard</h1>
        <p className="mt-1 text-slate-500 dark:text-zinc-400">Use AI prompts to generate a full dashboard layout.</p>
      </div>

      <Card className="dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Prompt Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Optional dashboard name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Textarea
            rows={8}
            placeholder="Describe the dashboard you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {item}
              </button>
            ))}
          </div>

          {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p> : null}

          <motion.div whileHover={{ y: -1 }}>
            <Button onClick={onGenerate} disabled={loading} className="gap-2">
              <WandSparkles size={14} />
              {loading ? "Generating dashboard..." : "Generate Dashboard"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
