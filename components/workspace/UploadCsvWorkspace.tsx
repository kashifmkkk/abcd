"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileSpreadsheet, Lightbulb } from "lucide-react";

export function UploadCsvWorkspace() {
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
      if (name.trim()) form.append("name", name.trim());

      const res = await fetch("/api/upload-csv", { method: "POST", body: form });
      const json = await res.json();
      const projectId = json?.data?.projectId;
      const refreshedAt = json?.data?.refreshedAt;

      if (!res.ok || !projectId) {
        setError(json?.error?.message ?? "Failed to import CSV");
        return;
      }

      router.push(`/dashboard/${projectId}?uploadedAt=${encodeURIComponent(String(refreshedAt ?? Date.now()))}`);
    } catch {
      setError("Failed to import CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload Dataset</h1>
        <p className="mt-1 text-slate-500 dark:text-zinc-400">Ingest data and let AI auto-generate your dashboard structure.</p>
      </div>

      <Card className="dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud size={16} className="text-amber-500" />
            Upload CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Optional dashboard name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            type="file"
            accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Supported formats: CSV and Excel (.xlsx). CSV ingestion is fully supported.
          </p>

          {error ? <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">{error}</p> : null}

          <motion.div whileHover={{ y: -1 }}>
            <Button onClick={onSubmit} disabled={loading} className="gap-2">
              <FileSpreadsheet size={14} />
              {loading ? "Understanding data and building dashboard..." : "Upload and Generate"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-base">Dataset Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-zinc-300">
            After upload, the platform detects entities, fields, and relationships for dashboard generation.
          </CardContent>
        </Card>

        <Card className="dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb size={15} className="text-amber-500" />
              Auto Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-zinc-300">
            AI suggests KPIs, charts, and table widgets based on your imported dataset.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
