type AiLogEntry = {
  timestamp: string;
  type: "prompt" | "raw-response" | "validated-spec" | "validation-error" | "correction-attempt";
  payload: unknown;
};

const logBuffer: AiLogEntry[] = [];
const MAX_LOGS = 200;

function pushLog(entry: AiLogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }
}

export function logAiPrompt(prompt: string) {
  pushLog({ timestamp: new Date().toISOString(), type: "prompt", payload: prompt });
  console.info("[ai][prompt]", prompt);
}

export function logAiRawResponse(response: string) {
  pushLog({ timestamp: new Date().toISOString(), type: "raw-response", payload: response });
  console.info("[ai][raw-response]", response);
}

export function logAiValidatedSpec(spec: unknown) {
  pushLog({ timestamp: new Date().toISOString(), type: "validated-spec", payload: spec });
  console.info("[ai][validated-spec]", JSON.stringify(spec));
}

export function logAiValidationError(error: unknown) {
  pushLog({ timestamp: new Date().toISOString(), type: "validation-error", payload: error });
  console.error("[ai][validation-error]", error);
}

export function logAiCorrectionAttempt(details: unknown) {
  pushLog({ timestamp: new Date().toISOString(), type: "correction-attempt", payload: details });
  console.warn("[ai][correction-attempt]", details);
}

export function getAiLogs() {
  return [...logBuffer];
}