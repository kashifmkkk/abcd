import type { DashboardSpec } from "@/types/spec";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an AI dashboard generator. Based on schema and user prompt, generate dashboard spec.

Return ONLY valid JSON matching this exact structure:

{
  "version": "1.0",
  "app": { "name": "string", "description": "string" },
  "auth": { "enabled": true, "roles": ["admin"] },
  "entities": [{ "name": "Entity", "label": "Entities", "fields": [{ "name": "field", "type": "string", "required": true, "label": "Field" }] }],
  "metrics": [{ "name": "metric_name", "label": "Metric Label", "entity": "Entity", "operation": "count", "field": "field" }],
  "widgets": [
    { "id": "widget_id", "type": "kpi", "title": "Title", "metric": "metric_name" },
    { "id": "chart_id", "type": "chart", "title": "Chart Title", "chartType": "bar", "entity": "Entity", "metricX": "field", "metrics": ["field"] },
    { "id": "table_id", "type": "table", "title": "Table Title", "entity": "Entity" }
  ],
  "layout": { "columns": 12, "items": [{ "i": "widget_id", "x": 0, "y": 0, "w": 4, "h": 2 }] }
}

Rules:
- Supported field types: string, text, integer, float, boolean, datetime.
- Supported metric operations: count, sum, avg, min, max.
- Supported widget types: kpi, chart, table.
- Supported chart types: bar, line, pie, area.
- Every metric must reference an existing entity. Non-count metrics must specify a field.
- Every widget id must have a matching layout item "i".
- Return ONLY the JSON object. No markdown, no explanation.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
  error?: { message: string };
}

// ─── Fallback spec generator (used when no API key is configured) ─────────────

interface PromptProfile {
  domain: string;
  entityName: string;
  entityLabel: string;
  fields: Array<{ name: string; type: "string" | "float" | "integer" | "datetime"; required: boolean; label: string }>;
  numericField: string;
  numericLabel: string;
}

const PROFILES: Array<{ pattern: RegExp; profile: PromptProfile }> = [
  {
    pattern: /sales|revenue|order|invoice|transaction|payment/i,
    profile: {
      domain: "Sales",
      entityName: "Order",
      entityLabel: "Orders",
      fields: [
        { name: "orderId", type: "string", required: true, label: "Order ID" },
        { name: "customer", type: "string", required: true, label: "Customer" },
        { name: "status", type: "string", required: true, label: "Status" },
        { name: "amount", type: "float", required: true, label: "Amount" },
        { name: "quantity", type: "integer", required: true, label: "Quantity" },
        { name: "createdAt", type: "datetime", required: true, label: "Created At" },
      ],
      numericField: "amount",
      numericLabel: "Revenue",
    },
  },
  {
    pattern: /inventory|stock|product|warehouse|supply/i,
    profile: {
      domain: "Inventory",
      entityName: "Product",
      entityLabel: "Products",
      fields: [
        { name: "sku", type: "string", required: true, label: "SKU" },
        { name: "name", type: "string", required: true, label: "Product Name" },
        { name: "category", type: "string", required: true, label: "Category" },
        { name: "price", type: "float", required: true, label: "Price" },
        { name: "stock", type: "integer", required: true, label: "Stock" },
        { name: "updatedAt", type: "datetime", required: true, label: "Updated At" },
      ],
      numericField: "stock",
      numericLabel: "Total Stock",
    },
  },
  {
    pattern: /hr|employee|staff|team|people|hiring/i,
    profile: {
      domain: "HR",
      entityName: "Employee",
      entityLabel: "Employees",
      fields: [
        { name: "employeeId", type: "string", required: true, label: "Employee ID" },
        { name: "name", type: "string", required: true, label: "Name" },
        { name: "department", type: "string", required: true, label: "Department" },
        { name: "salary", type: "float", required: true, label: "Salary" },
        { name: "tenure", type: "integer", required: true, label: "Tenure (months)" },
        { name: "hireDate", type: "datetime", required: true, label: "Hire Date" },
      ],
      numericField: "salary",
      numericLabel: "Total Salary",
    },
  },
  {
    pattern: /marketing|campaign|lead|conversion|funnel|analytics/i,
    profile: {
      domain: "Marketing",
      entityName: "Campaign",
      entityLabel: "Campaigns",
      fields: [
        { name: "campaignId", type: "string", required: true, label: "Campaign ID" },
        { name: "name", type: "string", required: true, label: "Campaign Name" },
        { name: "channel", type: "string", required: true, label: "Channel" },
        { name: "spend", type: "float", required: true, label: "Spend" },
        { name: "conversions", type: "integer", required: true, label: "Conversions" },
        { name: "startDate", type: "datetime", required: true, label: "Start Date" },
      ],
      numericField: "spend",
      numericLabel: "Total Spend",
    },
  },
];

const DEFAULT_PROFILE: PromptProfile = {
  domain: "Analytics",
  entityName: "Record",
  entityLabel: "Records",
  fields: [
    { name: "recordId", type: "string", required: true, label: "Record ID" },
    { name: "name", type: "string", required: true, label: "Name" },
    { name: "category", type: "string", required: true, label: "Category" },
    { name: "value", type: "float", required: true, label: "Value" },
    { name: "count", type: "integer", required: true, label: "Count" },
    { name: "createdAt", type: "datetime", required: true, label: "Created At" },
  ],
  numericField: "value",
  numericLabel: "Total Value",
};

function pickProfile(prompt: string): PromptProfile {
  for (const { pattern, profile } of PROFILES) {
    if (pattern.test(prompt)) return profile;
  }
  return DEFAULT_PROFILE;
}

function buildFallbackSpec(prompt: string): DashboardSpec {
  const p = pickProfile(prompt);
  const dateField = p.fields.find((f) => f.type === "datetime")?.name ?? "createdAt";

  return {
    version: "1.0",
    app: {
      name: `${p.domain} Dashboard`,
      description: `AI-generated ${p.domain.toLowerCase()} dashboard`,
    },
    auth: { enabled: true, roles: ["admin", "manager"] },
    entities: [{ name: p.entityName, label: p.entityLabel, fields: p.fields }],
    metrics: [
      { name: `${p.entityName.toLowerCase()}_count`, entity: p.entityName, operation: "count", label: `Total ${p.entityLabel}` },
      { name: `total_${p.numericField}`, entity: p.entityName, operation: "sum", field: p.numericField, label: p.numericLabel },
      { name: `avg_${p.numericField}`, entity: p.entityName, operation: "avg", field: p.numericField, label: `Avg ${p.numericLabel}` },
    ],
    widgets: [
      { id: "kpi_count", type: "kpi", title: `Total ${p.entityLabel}`, metric: `${p.entityName.toLowerCase()}_count` },
      { id: "kpi_total", type: "kpi", title: p.numericLabel, metric: `total_${p.numericField}` },
      { id: "kpi_avg", type: "kpi", title: `Avg ${p.numericLabel}`, metric: `avg_${p.numericField}` },
      { id: "trend_chart", type: "chart", title: `${p.numericLabel} Over Time`, chartType: "line", entity: p.entityName, metricX: dateField, metrics: [p.numericField] },
      { id: "dist_chart", type: "chart", title: `${p.entityLabel} Distribution`, chartType: "bar", entity: p.entityName, metricX: dateField, metrics: [p.numericField] },
      { id: "data_table", type: "table", title: p.entityLabel, entity: p.entityName },
    ],
    layout: {
      columns: 12,
      items: [
        { i: "kpi_count", x: 0, y: 0, w: 4, h: 2 },
        { i: "kpi_total", x: 4, y: 0, w: 4, h: 2 },
        { i: "kpi_avg", x: 8, y: 0, w: 4, h: 2 },
        { i: "trend_chart", x: 0, y: 2, w: 6, h: 5 },
        { i: "dist_chart", x: 6, y: 2, w: 6, h: 5 },
        { i: "data_table", x: 0, y: 7, w: 12, h: 6 },
      ],
    },
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

function hasValidApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.startsWith("sk-") && !key.includes("your") && key.length > 20);
}

export async function generateCompletion(prompt: string): Promise<string> {
  if (!hasValidApiKey()) {
    console.info("[ai] No valid OPENAI_API_KEY — using fallback spec generator");
    const spec = buildFallbackSpec(prompt);
    await new Promise((resolve) => setTimeout(resolve, 150));
    return JSON.stringify(spec, null, 2);
  }

  const apiKey = process.env.OPENAI_API_KEY!;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorBody}`);
  }

  const data = (await res.json()) as OpenAIResponse;

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return content;
}