"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateDashboardPage() {
  const router = useRouter();
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
      const res = await fetch("/api/generate-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const json = await res.json();
      const projectId = json?.data?.projectId;

      if (!res.ok || !projectId) {
        setError(json?.error?.message ?? "Failed to generate dashboard");
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
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Dashboard with AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={6}
            placeholder="Create a marketing dashboard with leads and conversion charts"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onGenerate} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Generating dashboard...
              </span>
            ) : (
              "Generate Dashboard"
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
