/** Insight categories produced by the AI insights engine */
export type InsightType = "trend" | "top_value" | "distribution" | "outlier";

/** A single data-driven insight */
export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  severity: "info" | "warning" | "positive";
}
