import type { DashboardSpec } from "@/types/spec";
import { generateSpecFromPrompt } from "@/lib/ai/specGenerator";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a DashboardSpec from a natural-language prompt.
 *
 * @param prompt - Free-text description of the desired dashboard.
 * @returns A DashboardSpec object (NOT yet validated — validate with specValidator).
 */
export async function generateSpec(prompt: string): Promise<DashboardSpec> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt must not be empty");
  }
  return generateSpecFromPrompt(prompt.trim());
}
