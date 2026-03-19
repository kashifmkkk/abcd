import { describe, it, expect } from "vitest";
import { classifyAllColumns } from "@/lib/ai/columnClassifier";
import { generateInsights } from "@/lib/ai/insightsEngine";
import type { ClassifiedColumn } from "@/lib/ai/columnClassifier";

function makeRows(
  months: Array<{ month: string; rows: Array<{ product: string; amount: number; quantity: number }> }>
): Record<string, string>[] {
  const records: Record<string, string>[] = [];

  for (const m of months) {
    for (const row of m.rows) {
      records.push({
        product: row.product,
        amount: String(row.amount),
        quantity: String(row.quantity),
        createdAt: `${m.month}-15T00:00:00Z`,
      });
    }
  }

  return records;
}

describe("insightsEngine", () => {
  it("detects MoM trends", () => {
    const rows = makeRows([
      { month: "2026-01", rows: [{ product: "A", amount: 100, quantity: 5 }] },
      { month: "2026-02", rows: [{ product: "A", amount: 150, quantity: 6 }] },
    ]);

    const columns: ClassifiedColumn[] = [
      { name: "product", role: "categorical", uniqueCount: 1, sample: ["A"] },
      { name: "amount", role: "continuous", uniqueCount: 2, sample: ["100", "150"] },
      { name: "quantity", role: "continuous", uniqueCount: 2, sample: ["5", "6"] },
      { name: "createdAt", role: "datetime", uniqueCount: 2, sample: ["2026-01-15", "2026-02-15"] },
    ];
    const insights = generateInsights(columns, rows);

    const trends = insights.filter((i) => i.type === "trend");
    expect(trends.length).toBeGreaterThan(0);
    expect(trends.some((t) => t.description.includes("increased"))).toBe(true);
  });

  it("detects top values", () => {
    const rows = makeRows([
      {
        month: "2026-01",
        rows: [
          { product: "Hydraulic Pump", amount: 5000, quantity: 10 },
          { product: "Valve", amount: 2000, quantity: 20 },
          { product: "Seal Kit", amount: 500, quantity: 50 },
        ],
      },
    ]);

    const columns = classifyAllColumns(rows);
    const insights = generateInsights(columns, rows);

    const topValues = insights.filter((i) => i.type === "top_value");
    expect(topValues.length).toBeGreaterThan(0);
    expect(topValues.some((t) => t.title.includes("Summary"))).toBe(true);
  });

  it("detects outliers", () => {
    const variableRows: Array<{ product: string; amount: number; quantity: number }> = [];
    for (let i = 0; i < 20; i++) {
      variableRows.push({ product: "A", amount: 100 + i, quantity: 5 });
    }
    variableRows.push({ product: "A", amount: 900, quantity: 5 });

    const rows = makeRows([{ month: "2026-01", rows: variableRows }]);

    const columns: ClassifiedColumn[] = [
      { name: "product", role: "categorical", uniqueCount: 1, sample: ["A"] },
      { name: "amount", role: "continuous", uniqueCount: 21, sample: ["100", "101", "900"] },
      { name: "quantity", role: "continuous", uniqueCount: 1, sample: ["5"] },
      { name: "createdAt", role: "datetime", uniqueCount: 1, sample: ["2026-01-15"] },
    ];
    const insights = generateInsights(columns, rows);

    const outliers = insights.filter((i) => i.type === "outlier");
    expect(outliers.length).toBeGreaterThan(0);
  });

  it("returns empty insights for empty dataset", () => {
    const insights = generateInsights([], []);
    expect(insights).toEqual([]);
  });
});
