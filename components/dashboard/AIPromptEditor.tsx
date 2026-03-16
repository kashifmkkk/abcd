"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AIPromptEditorProps {
  projectId: string;
  onSuccess?: (message: string) => void;
  defaultPrompt?: string;
}

export function AIPromptEditor({ projectId, onSuccess, defaultPrompt = "" }: AIPromptEditorProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitPrompt() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Please enter a prompt.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt: trimmed }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error?.message ?? "Failed to update dashboard");
        return;
      }

      setPrompt("");
      onSuccess?.(json?.data?.message ?? "Dashboard updated with AI");
    } catch {
      setError("Unable to update dashboard right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Add revenue KPI, Add sales trend chart, Add product stock table"
        className="min-h-[96px] resize-y"
      />
      <div className="flex items-center justify-between gap-2">
        {error ? (
          <p className="text-xs text-rose-500">{error}</p>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">Prompt-based dashboard editing</span>
        )}
        <Button size="sm" onClick={() => void submitPrompt()} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {loading ? "Updating..." : "Apply Prompt"}
        </Button>
      </div>
    </div>
  );
}
