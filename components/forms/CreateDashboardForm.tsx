"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTION_TAGS = [
  "Sales KPIs",
  "Inventory tracker",
  "Marketing metrics",
  "Revenue chart",
  "User analytics",
  "Stock overview",
];

export function CreateDashboardForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setError(json.error ?? "Failed to create dashboard");
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

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
    >
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dashboard name"
      />

      <Textarea
        required
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the dashboard you want to create..."
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTION_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setPrompt((prev) => (prev ? `${prev}, ${tag}` : tag))}
            className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {error ? <p className="chat-form-error">{error}</p> : <span />}
        <Button type="submit" disabled={loading || prompt.trim().length < 5}>
          {loading ? "Generating..." : "Create dashboard"}
        </Button>
      </div>
    </form>
  );
}
