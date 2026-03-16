"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadCsvPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (name.trim()) {
        form.append("name", name.trim());
      }

      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      const projectId = json?.data?.projectId;

      if (!res.ok || !projectId) {
        setError(json?.error?.message ?? "Failed to import CSV");
        return;
      }

      router.push(`/dashboard/${projectId}`);
    } catch {
      setError("Failed to import CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV and Auto-Build Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Optional dashboard name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button onClick={onSubmit} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                Understanding data and building dashboard...
              </span>
            ) : (
              "Upload and Generate"
            )}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
