import { describe, expect, it } from "vitest";
import { validateSpec } from "../lib/validators/specValidator";
import type { DashboardSpec } from "../types/spec";

function baseSpec(): DashboardSpec {
  return {
    version: "1.0",
    app: { name: "Inventory" },
    auth: { enabled: true, roles: ["admin"] },
    entities: [
      {
        name: "Product",
        fields: [
          { name: "name", type: "string", required: true },
          { name: "stock", type: "integer", required: true },
        ],
      },
    ],
    metrics: [
      {
        name: "total_stock",
        entity: "Product",
        operation: "sum",
        field: "stock",
      },
    ],
    widgets: [
      {
        id: "kpi_1",
        type: "kpi",
        title: "Stock",
        metric: "total_stock",
      },
    ],
    layout: {
      columns: 12,
      items: [{ i: "kpi_1", x: 0, y: 0, w: 4, h: 2 }],
    },
  };
}

describe("spec validator", () => {
  it("accepts valid spec", () => {
    expect(() => validateSpec(baseSpec())).not.toThrow();
  });

  it("rejects duplicate entity names", () => {
    const spec = baseSpec();
    spec.entities.push({ name: "Product", fields: [{ name: "x", type: "string" }] });
    expect(() => validateSpec(spec)).toThrow(/Duplicate entity name/i);
  });

  it("rejects metric referencing missing field", () => {
    const spec = baseSpec();
    spec.metrics[0].field = "missing";
    expect(() => validateSpec(spec)).toThrow(/missing field/i);
  });

  it("rejects widget referencing missing metric", () => {
    const spec = baseSpec();
    spec.widgets[0].metric = "unknown_metric";
    expect(() => validateSpec(spec)).toThrow(/missing metric/i);
  });
});
