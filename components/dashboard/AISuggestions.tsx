"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSpec, WidgetDef } from "@/types/spec";

interface SuggestionItem {
  suggestion: string;
}

interface AISuggestionsProps {
  projectId: string;
  spec?: DashboardSpec;
  onSpecUpdated?: (next: DashboardSpec) => void;
  onApplied?: () => void;
}

function addLayoutItem(spec: DashboardSpec, widgetId: string, w = 6, h = 4) {
  const maxY = spec.layout.items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return {
    ...spec,
    layout: {
      ...spec.layout,
      items: [...spec.layout.items, { i: widgetId, x: 0, y: maxY, w, h }],
    },
  };
}

function ensureUniqueId(spec: DashboardSpec, base: string) {
  let idx = 1;
  let id = `${base}_${idx}`;
  const ids = new Set(spec.widgets.map((w) => w.id));
  while (ids.has(id)) {
    idx += 1;
    id = `${base}_${idx}`;
  }
  return id;
}

function applySuggestionToSpec(spec: DashboardSpec, rawSuggestion: string): DashboardSpec {
  const suggestion = rawSuggestion.toLowerCase();
  let nextSpec: DashboardSpec = {
    ...spec,
    widgets: [...spec.widgets],
    metrics: [...spec.metrics],
    layout: { ...spec.layout, items: [...spec.layout.items] },
  };

  if (suggestion.includes("kpi")) {
    const candidate = nextSpec.metrics.find((metric) => !nextSpec.widgets.some((w) => w.metric === metric.name));
    if (!candidate) return nextSpec;

    const widgetId = ensureUniqueId(nextSpec, candidate.name);
    const widget: WidgetDef = {
      id: widgetId,
      type: "kpi",
      title: candidate.label ?? candidate.name,
      metric: candidate.name,
    };

    nextSpec.widgets.push(widget);
    nextSpec = addLayoutItem(nextSpec, widgetId, 4, 3);
    return nextSpec;
  }

  if (suggestion.includes("chart") || suggestion.includes("pie") || suggestion.includes("trend")) {
    const metric =
      nextSpec.metrics.find((m) => /revenue|sales|amount/i.test(m.name)) ??
      nextSpec.metrics[0];
    if (!metric) return nextSpec;

    const entity = nextSpec.entities.find((e) => e.name === metric.entity);
    const xField = entity?.fields.find((f) => f.type === "datetime")?.name ?? entity?.fields[0]?.name ?? "label";
    const yField = metric.field ?? entity?.fields.find((f) => f.type === "integer" || f.type === "float")?.name;

    const widgetId = ensureUniqueId(nextSpec, `${metric.name}_chart`);
    const widget: WidgetDef = {
      id: widgetId,
      type: "chart",
      title: suggestion.includes("pie") ? "Distribution" : `${metric.label ?? metric.name} Trend`,
      chartType: suggestion.includes("pie") ? "pie" : "line",
      metric: metric.name,
      entity: metric.entity,
      metricX: xField,
      metrics: yField ? [yField] : undefined,
    };

    nextSpec.widgets.push(widget);
    nextSpec = addLayoutItem(nextSpec, widgetId, 8, 5);
    return nextSpec;
  }

  const fallbackEntity = nextSpec.entities[0];
  if (!fallbackEntity) return nextSpec;

  const widgetId = ensureUniqueId(nextSpec, `${fallbackEntity.name.toLowerCase()}_table`);
  nextSpec.widgets.push({
    id: widgetId,
    type: "table",
    title: `${fallbackEntity.label ?? fallbackEntity.name} Table`,
    entity: fallbackEntity.name,
  });
  nextSpec = addLayoutItem(nextSpec, widgetId, 12, 6);

  return nextSpec;
}

export function AISuggestions({ projectId, spec, onSpecUpdated, onApplied }: AISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectSpec, setProjectSpec] = useState<DashboardSpec | null>(spec ?? null);

  const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions.length]);

  const fetchProjectSpec = async () => {
    const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.success || !json.data?.specJson) {
      throw new Error("Failed to load project spec");
    }

    const loaded = json.data.specJson as DashboardSpec;
    setProjectSpec(loaded);
    return loaded;
  };

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? "Failed to fetch suggestions");
        return;
      }

      setSuggestions(json.data.suggestions ?? []);
    } catch {
      setError("Failed to fetch suggestions");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestion: string) => {
    setApplying(suggestion);
    setError(null);
    try {
      const baseSpec = projectSpec ?? (await fetchProjectSpec());
      const nextSpec = applySuggestionToSpec(baseSpec, suggestion);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specJson: nextSpec }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json?.error ?? json?.error?.message ?? "Failed to apply suggestion");
        return;
      }

      setProjectSpec(nextSpec);
      onSpecUpdated?.(nextSpec);
      onApplied?.();
      setSuggestions((prev) => prev.filter((item) => item.suggestion !== suggestion));
    } catch {
      setError("Failed to apply suggestion");
    } finally {
      setApplying(null);
    }
  };

  return (
    <Card id="ai-suggestions">
      <CardHeader>
        <CardTitle>AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={loadSuggestions} disabled={loading} className="w-full">
          {loading ? "Analyzing..." : "Get Suggestions"}
        </Button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!hasSuggestions && !loading ? (
          <p className="text-sm text-slate-500">No suggestions loaded yet.</p>
        ) : null}

        <div className="space-y-2">
          {suggestions.map((item) => (
            <div key={item.suggestion} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-700">{item.suggestion}</p>
              <Button
                size="sm"
                className="mt-2"
                disabled={applying === item.suggestion}
                onClick={() => applySuggestion(item.suggestion)}
              >
                {applying === item.suggestion ? "Applying..." : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

