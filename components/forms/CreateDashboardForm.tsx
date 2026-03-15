"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={onSubmit}>
      <div className="space-y-1">
        <Label htmlFor="name">Dashboard name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Inventory Dashboard" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create an inventory dashboard with products, stock KPIs, and sales chart"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading || prompt.trim().length < 5}>
        {loading ? "Generating..." : "Create dashboard"}
      </Button>
    </form>
  );
}
