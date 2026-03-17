/** Insight categories produced by the AI insights engine */
export type InsightType = "trend" | "top_value" | "outlier";

/** A single data-driven insight */
export interface Insight {
  type: InsightType;
  message: string;
  /** The field/metric this insight relates to */
  field?: string;
  /** The entity this insight relates to */
  entity?: string;
}
