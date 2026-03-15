import { describe, expect, it } from "vitest";
import { computeMetricFromRecords } from "../lib/metric-engine/metricEngine";
import type { MetricDef } from "../types/spec";

const records = [
  { stock: 10, price: 2 },
  { stock: 20, price: 3 },
  { stock: 30, price: 4 },
];

describe("metric engine pure aggregation", () => {
  it("computes sum", () => {
    const metric: MetricDef = {
      name: "total_stock",
      entity: "Product",
      operation: "sum",
      field: "stock",
    };

    expect(computeMetricFromRecords(metric, records)).toBe(60);
  });

  it("computes avg", () => {
    const metric: MetricDef = {
      name: "avg_price",
      entity: "Product",
      operation: "avg",
      field: "price",
    };

    expect(computeMetricFromRecords(metric, records)).toBe(3);
  });

  it("computes count", () => {
    const metric: MetricDef = {
      name: "count_products",
      entity: "Product",
      operation: "count",
    };

    expect(computeMetricFromRecords(metric, records)).toBe(3);
  });
});
