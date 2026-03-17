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

/** Schema field descriptor passed to the LLM for context */
export interface SchemaField {
  name: string;
  type: string;
}

function buildUserPrompt(prompt: string, schema?: SchemaField[]) {
  let message = `User request: ${prompt}`;

  if (schema && schema.length > 0) {
    message += `\n\nDetected CSV schema:\n${JSON.stringify(schema, null, 2)}`;
    message += `\n\nUse these columns as entity fields. Infer appropriate metrics, widgets, and layout from the schema.`;
  }

  return message;
}

function buildCorrectionPrompt(prompt: string, rawResponse: string, error: unknown, schema?: SchemaField[]) {
  let message = `The previous JSON was invalid.\nOriginal user request: ${prompt}`;

  if (schema && schema.length > 0) {
    message += `\n\nDetected CSV schema:\n${JSON.stringify(schema, null, 2)}`;
  }

  message += `\nPrevious response: ${rawResponse}`;
  message += `\nValidation error: ${JSON.stringify(error)}`;
  message += `\n\nReturn corrected JSON only.`;

  return message;
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

export async function generateSpecFromPrompt(prompt: string, schema?: SchemaField[]): Promise<DashboardSpec> {
  if (!prompt || prompt.trim().length < 5) {
    throw new Error("Prompt must be at least 5 characters");
  }

  const userPrompt = buildUserPrompt(prompt.trim(), schema);
  logAiPrompt(userPrompt);

  try {
    const { spec } = await requestAndValidate(userPrompt);
    return spec;
  } catch (error) {
    logAiValidationError(error);
    const details = error instanceof ZodError ? error.issues : error;
    logAiCorrectionAttempt(details);

    const correctionPrompt = buildCorrectionPrompt(
      prompt.trim(),
      typeof details === "string" ? details : JSON.stringify(details),
      details,
      schema,
    );
    const { spec } = await requestAndValidate(correctionPrompt);
    return spec;
  }
}