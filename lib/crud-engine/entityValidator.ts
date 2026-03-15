import type { EntityDef } from "@/types/spec";

export interface EntityValidationSuccess {
  ok: true;
  data: Record<string, unknown>;
}

export interface EntityValidationFailure {
  ok: false;
  issues: string[];
}

export type EntityValidationResult = EntityValidationSuccess | EntityValidationFailure;

function coerceByType(type: EntityDef["fields"][number]["type"], value: unknown): unknown {
  if (value === undefined || value === null) return null;

  switch (type) {
    case "string":
    case "text":
      return String(value);
    case "integer": {
      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : NaN;
    }
    case "float": {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return "INVALID_BOOLEAN";
    case "datetime": {
      const timestamp = new Date(String(value)).getTime();
      if (Number.isNaN(timestamp)) return "INVALID_DATETIME";
      return new Date(timestamp).toISOString();
    }
    default:
      return value;
  }
}

export function validateEntityPayload(
  entity: EntityDef,
  payload: Record<string, unknown>
): EntityValidationResult {
  const issues: string[] = [];
  const sanitized: Record<string, unknown> = {};

  const allowedFields = new Set(entity.fields.map((field) => field.name));

  for (const key of Object.keys(payload)) {
    if (!allowedFields.has(key)) {
      issues.push(`Unknown field: ${key}`);
    }
  }

  for (const field of entity.fields) {
    const rawValue = payload[field.name];

    if (
      field.required &&
      (rawValue === undefined || rawValue === null || rawValue === "")
    ) {
      issues.push(`Field "${field.name}" is required`);
      continue;
    }

    if (rawValue === undefined) {
      if (field.default !== undefined) sanitized[field.name] = field.default;
      continue;
    }

    const coerced = coerceByType(field.type, rawValue);

    if (Number.isNaN(coerced)) {
      issues.push(`Field "${field.name}" must be a ${field.type}`);
      continue;
    }

    if (coerced === "INVALID_BOOLEAN") {
      issues.push(`Field "${field.name}" must be a boolean`);
      continue;
    }

    if (coerced === "INVALID_DATETIME") {
      issues.push(`Field "${field.name}" must be a valid datetime`);
      continue;
    }

    sanitized[field.name] = coerced;
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, data: sanitized };
}
