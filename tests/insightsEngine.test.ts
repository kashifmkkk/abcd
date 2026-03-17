import { describe, it, expect } from "vitest";
import { generateInsights, type DatasetInput } from "@/lib/ai/insightsEngine";
import type { EntityDef } from "@/types/spec";

const salesEntity: EntityDef = {
  name: "Order",
  label: "Orders",
  fields: [
    { name: "product", type: "string", required: true, label: "Product" },
    { name: "amount", type: "float", required: true, label: "Revenue" },
    { name: "quantity", type: "integer", required: true, label: "Quantity" },
    { name: "createdAt", type: "datetime", required: true, label: "Created At" },
  ],
};

function makeRecords(
  months: Array<{ month: string; rows: Array<{ product: string; amount: number; quantity: number }> }>,
): Array<Record<string, unknown>> {
  const records: Array<Record<string, unknown>> = [];
  for (const m of months) {
    for (const row of m.rows) {
      records.push({
        product: row.product,
        amount: row.amount,
        quantity: row.quantity,
        createdAt: `${m.month}-15T00:00:00Z`,
      });
    }
  }
  return records;
}

describe("insightsEngine", () => {
  it("detects MoM trends", () => {
    const records = makeRecords([
      { month: "2026-01", rows: [{ product: "A", amount: 100, quantity: 5 }] },
      { month: "2026-02", rows: [{ product: "A", amount: 150, quantity: 6 }] },
    ]);

    const input: DatasetInput[] = [{ entity: salesEntity, records }];
    const insights = generateInsights(input);

    const trends = insights.filter((i) => i.type === "trend");
    expect(trends.length).toBeGreaterThan(0);
    expect(trends.some((t) => t.message.includes("Revenue"))).toBe(true);
    expect(trends.some((t) => t.message.includes("+50%"))).toBe(true);
  });

  it("detects top values", () => {
    const records = makeRecords([
      {
        month: "2026-01",
        rows: [
          { product: "Hydraulic Pump", amount: 5000, quantity: 10 },
          { product: "Valve", amount: 2000, quantity: 20 },
          { product: "Seal Kit", amount: 500, quantity: 50 },
        ],
      },
    ]);

    const input: DatasetInput[] = [{ entity: salesEntity, records }];
    const insights = generateInsights(input);

    const topValues = insights.filter((i) => i.type === "top_value");
    expect(topValues.length).toBeGreaterThan(0);
    expect(topValues.some((t) => t.message.includes("Hydraulic Pump"))).toBe(true);
  });

  it("detects outliers", () => {
    // Normal values around 100, with a spike at 900
    const rows: Array<{ product: string; amount: number; quantity: number }> = [];
    for (let i = 0; i < 20; i++) {
      rows.push({ product: "A", amount: 95 + Math.round(Math.random() * 10), quantity: 5 });
    }
    rows.push({ product: "A", amount: 900, quantity: 5 });

    const records = makeRecords([{ month: "2026-01", rows }]);

    const input: DatasetInput[] = [{ entity: salesEntity, records }];
    const insights = generateInsights(input);

    const outliers = insights.filter((i) => i.type === "outlier");
    expect(outliers.length).toBeGreaterThan(0);
    expect(outliers.some((t) => t.message.includes("spike"))).toBe(true);
  });

  it("returns empty insights for empty dataset", () => {
    const input: DatasetInput[] = [{ entity: salesEntity, records: [] }];
    const insights = generateInsights(input);
    expect(insights).toEqual([]);
  });
});
