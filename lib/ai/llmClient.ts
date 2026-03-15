import type { DashboardSpec } from "@/types/spec";

function buildSalesSpec(): DashboardSpec {
  return {
    version: "1.0",
    app: {
      name: "Sales Dashboard",
      description: "AI-generated sales dashboard with orders and revenue charts",
    },
    auth: {
      enabled: true,
      roles: ["admin", "manager"],
    },
    entities: [
      {
        name: "Order",
        label: "Orders",
        fields: [
          { name: "orderId", type: "string", required: true, label: "Order ID" },
          { name: "customer", type: "string", required: true, label: "Customer" },
          { name: "status", type: "string", required: true, label: "Status" },
          { name: "amount", type: "float", required: true, label: "Amount" },
          { name: "quantity", type: "integer", required: true, label: "Quantity" },
          { name: "createdAt", type: "datetime", required: true, label: "Created At" },
        ],
      },
    ],
    metrics: [
      { name: "total_orders", entity: "Order", operation: "count", label: "Total Orders" },
      { name: "total_revenue", entity: "Order", operation: "sum", field: "amount", label: "Total Revenue" },
      { name: "avg_order_value", entity: "Order", operation: "avg", field: "amount", label: "Avg Order Value" },
    ],
    widgets: [
      { id: "orders_kpi", type: "kpi", title: "Total Orders", metric: "total_orders" },
      { id: "revenue_kpi", type: "kpi", title: "Total Revenue", metric: "total_revenue" },
      { id: "aov_kpi", type: "kpi", title: "Avg Order Value", metric: "avg_order_value" },
      {
        id: "revenue_chart",
        type: "chart",
        title: "Revenue Over Time",
        chartType: "line",
        entity: "Order",
        metricX: "createdAt",
        metrics: ["amount"],
      },
      {
        id: "orders_chart",
        type: "chart",
        title: "Orders Quantity Over Time",
        chartType: "bar",
        entity: "Order",
        metricX: "createdAt",
        metrics: ["quantity"],
      },
      { id: "orders_table", type: "table", title: "Orders", entity: "Order" },
    ],
    layout: {
      columns: 12,
      items: [
        { i: "orders_kpi", x: 0, y: 0, w: 4, h: 2 },
        { i: "revenue_kpi", x: 4, y: 0, w: 4, h: 2 },
        { i: "aov_kpi", x: 8, y: 0, w: 4, h: 2 },
        { i: "revenue_chart", x: 0, y: 2, w: 6, h: 5 },
        { i: "orders_chart", x: 6, y: 2, w: 6, h: 5 },
        { i: "orders_table", x: 0, y: 7, w: 12, h: 6 },
      ],
    },
  };
}

function buildInventorySpec(): DashboardSpec {
  return {
    version: "1.0",
    app: {
      name: "Inventory Dashboard",
      description: "AI-generated inventory dashboard",
    },
    auth: {
      enabled: true,
      roles: ["admin", "viewer"],
    },
    entities: [
      {
        name: "Product",
        fields: [
          { name: "name", type: "string", required: true },
          { name: "price", type: "float", required: true },
          { name: "stock", type: "integer", required: true },
        ],
      },
    ],
    metrics: [
      { name: "total_stock", entity: "Product", operation: "sum", field: "stock" },
      { name: "avg_price", entity: "Product", operation: "avg", field: "price" },
    ],
    widgets: [
      { id: "stock_kpi", type: "kpi", title: "Total Stock", metric: "total_stock" },
      {
        id: "price_chart",
        type: "chart",
        title: "Price by Product",
        chartType: "bar",
        entity: "Product",
        metricX: "name",
        metrics: ["price"],
      },
      { id: "products_table", type: "table", title: "Products", entity: "Product" },
    ],
    layout: {
      columns: 12,
      items: [
        { i: "stock_kpi", x: 0, y: 0, w: 4, h: 2 },
        { i: "price_chart", x: 0, y: 2, w: 12, h: 5 },
        { i: "products_table", x: 0, y: 7, w: 12, h: 6 },
      ],
    },
  };
}

export async function generateCompletion(prompt: string): Promise<string> {
  const lowerPrompt = prompt.toLowerCase();
  const spec = /sales|order|revenue/.test(lowerPrompt) ? buildSalesSpec() : buildInventorySpec();

  await new Promise((resolve) => setTimeout(resolve, 150));
  return JSON.stringify(spec, null, 2);
}