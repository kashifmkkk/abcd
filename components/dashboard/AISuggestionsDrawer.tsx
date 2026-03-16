"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AIPromptEditor } from "@/components/dashboard/AIPromptEditor";

interface AISuggestionsDrawerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied?: (message: string) => void;
}

interface SuggestionItem {
  suggestion: string;
}

export function AISuggestionsDrawer({
  projectId,
  open,
  onOpenChange,
  onApplied,
}: AISuggestionsDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingSuggestion, setApplyingSuggestion] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function generateSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error?.message ?? "Could not generate suggestions");
        return;
      }

      const suggested = (json.data?.suggestions ?? []) as SuggestionItem[];
      const promptSuggestion = prompt.trim()
        ? [{ suggestion: prompt.trim() }, ...suggested]
        : suggested;

      // remove duplicates by suggestion text
      const unique = Array.from(new Map(promptSuggestion.map((item) => [item.suggestion.toLowerCase(), item])).values());
      setSuggestions(unique);
    } catch {
      setError("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestion(suggestionText: string) {
    setApplyingSuggestion(suggestionText);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt: suggestionText }),
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        setError(json?.error?.message ?? "Could not apply suggestion");
        return;
      }

      onApplied?.(json?.data?.message ?? "Dashboard updated with AI");
    } catch {
      setError("Failed to apply suggestion");
    } finally {
      setApplyingSuggestion(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0">
        <SheetHeader className="border-b border-slate-100 dark:border-slate-800">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" />
            AI Dashboard Assistant
          </SheetTitle>
          <SheetDescription>
            Generate and apply AI suggestions to evolve your dashboard spec.
          </SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100vh-90px)] overflow-y-auto p-5 space-y-5">
          {/* Prompt input + suggestion generator */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prompt</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what to improve... e.g. Add sales trend chart"
              className="min-h-[100px]"
            />
            <Button onClick={() => void generateSuggestions()} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Generating..." : "Generate Suggestions"}
            </Button>
          </div>

          {/* Suggestions list */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Suggestions</p>
            {suggestions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
                No suggestions yet. Generate suggestions to begin.
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <div
                    key={item.suggestion}
                    className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item.suggestion}</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => void applySuggestion(item.suggestion)}
                      disabled={applyingSuggestion === item.suggestion}
                    >
                      {applyingSuggestion === item.suggestion ? "Applying..." : "Apply Suggestion"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct prompt-based editor */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Quick Edit</p>
            <AIPromptEditor projectId={projectId} onSuccess={onApplied} defaultPrompt={prompt} />
          </div>

          {error ? <p className="text-xs text-rose-500">{error}</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
