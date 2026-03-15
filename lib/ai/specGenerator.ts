import { ZodError } from "zod";
import type { DashboardSpec } from "@/types/spec";
import { validateSpec } from "@/lib/validators/specValidator";
import { generateCompletion } from "@/lib/ai/llmClient";
import {
  logAiCorrectionAttempt,
  logAiPrompt,
  logAiRawResponse,
  logAiValidatedSpec,
  logAiValidationError,
} from "@/lib/logging/aiLogs";

const SYSTEM_PROMPT = `You are an expert SaaS dashboard architect.

Convert user requests into a JSON dashboard specification.
Return only valid JSON.

Supported field types: string, text, integer, float, boolean, datetime.
Supported metric operations: count, sum, avg, min, max.
Supported widget types: kpi, chart, table.
Supported chart types: bar, line, pie.

Schema:
{
  "version": "1.0",
  "app": { "name": "string", "description": "string" },
  "auth": { "enabled": true, "roles": ["admin"] },
  "entities": [{ "name": "Entity", "fields": [{ "name": "field", "type": "string", "required": true }] }],
  "metrics": [{ "name": "metric_name", "entity": "Entity", "operation": "count", "field": "field" }],
  "widgets": [{ "id": "widget_id", "type": "kpi", "title": "Title", "metric": "metric_name" }],
  "layout": { "columns": 12, "items": [{ "i": "widget_id", "x": 0, "y": 0, "w": 4, "h": 2 }] }
}

Entities define database models.
Metrics define aggregated analytics.
Widgets define dashboard UI components.
Do not generate unsupported field types or widget types.`;

function buildUserPrompt(prompt: string) {
  return `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;
}

function buildCorrectionPrompt(prompt: string, rawResponse: string, error: unknown) {
  return `${SYSTEM_PROMPT}

The previous JSON was invalid.
Original user request: ${prompt}
Previous response: ${rawResponse}
Validation error: ${JSON.stringify(error)}

Return corrected JSON only.`;
}

export function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON from LLM: ${error instanceof Error ? error.message : "unknown parse error"}`);
  }
}

async function requestAndValidate(prompt: string): Promise<{ spec: DashboardSpec; raw: string }> {
  const raw = await generateCompletion(prompt);
  logAiRawResponse(raw);
  const parsed = safeJsonParse(raw);
  const spec = validateSpec(parsed);
  logAiValidatedSpec(spec);
  return { spec, raw };
}

export async function generateSpecFromPrompt(prompt: string): Promise<DashboardSpec> {
  if (!prompt || prompt.trim().length < 5) {
    throw new Error("Prompt must be at least 5 characters");
  }

  const userPrompt = buildUserPrompt(prompt.trim());
  logAiPrompt(userPrompt);

  try {
    const { spec } = await requestAndValidate(userPrompt);
    return spec;
  } catch (error) {
    logAiValidationError(error);
    const details = error instanceof ZodError ? error.issues : error;
    logAiCorrectionAttempt(details);

    const correctionPrompt = buildCorrectionPrompt(prompt.trim(), typeof details === "string" ? details : JSON.stringify(details), details);
    const { spec } = await requestAndValidate(correctionPrompt);
    return spec;
  }
}