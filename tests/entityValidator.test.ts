import { describe, expect, it } from "vitest";
import { validateEntityPayload } from "../lib/crud-engine/entityValidator";
import type { EntityDef } from "../types/spec";

const entity: EntityDef = {
  name: "Product",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "price", type: "float", required: true },
    { name: "stock", type: "integer", required: true },
    { name: "active", type: "boolean" },
  ],
};

describe("entity payload validator", () => {
  it("accepts valid payload", () => {
    const result = validateEntityPayload(entity, {
      name: "A",
      price: "10.5",
      stock: "2",
      active: "true",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.price).toBe(10.5);
      expect(result.data.stock).toBe(2);
      expect(result.data.active).toBe(true);
    }
  });

  it("rejects unknown fields", () => {
    const result = validateEntityPayload(entity, {
      name: "A",
      price: 10,
      stock: 2,
      extra: "x",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.join(" ")).toMatch(/Unknown field/i);
    }
  });

  it("rejects missing required fields", () => {
    const result = validateEntityPayload(entity, {
      name: "A",
      price: 10,
    });

    expect(result.ok).toBe(false);
  });
});
