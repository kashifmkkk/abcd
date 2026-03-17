import type { DashboardSpec } from "@/types/spec";
import { generateSpecFromPrompt, type SchemaField } from "@/lib/ai/specGenerator";
import { validateSpec } from "@/lib/validators/specValidator";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a DashboardSpec from a natural-language prompt and optional CSV schema.
 *
 * @param prompt - Free-text description of the desired dashboard.
 * @param schema - Optional detected CSV schema (column names and types).
 * @returns A validated DashboardSpec object.
 */
export async function generateDashboardSpec(
  prompt: string,
  schema?: SchemaField[],
): Promise<DashboardSpec> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt must not be empty");
  }

  const spec = await generateSpecFromPrompt(prompt.trim(), schema);

  // Validate before returning to ensure strict conformance
  const validated = validateSpec(spec);
  return validated;
}

/**
 * @deprecated Use `generateDashboardSpec` instead.
 */
export async function generateSpec(prompt: string): Promise<DashboardSpec> {
  return generateDashboardSpec(prompt);
}
