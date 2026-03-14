// backend/chatbot/config/api.catalog.js

export const API_CATALOG = [
  {
    name: "product-analysis",
    path: "/api/product-analysis",
    method: "GET",
    description:
      "Analyze product performance: profit, top selling products, category-wise analytics over time, periodic profit",
    params: {
      range: "time duration in natural language (e.g., 'last month', 'last 3 months', '6 months', 'yearly', 'all time'). System auto-converts to: 1m/3m/6m/1y/3y/4y/5y/all",
      category: "optional product category"
    },
    supportedRanges: ["today", "1 week", "last month", "3 months", "6 months", "1 year", "3 years", "4 years", "5 years", "all time"]
  },
  {
    name: "shop-analysis",
    path: "/api/shop-analysis",
    method: "GET",
    description:
      "Overall shop analytics: today's profit, daily sales, stock value, turnover, monthly performance, shop status",
    params: {
      month: "time period in natural language (e.g., 'last month', 'this month', 'January 2024'). System auto-converts to: YYYY-MM format"
    },
    supportedRanges: ["this month", "last month", "current month"]
  },
  {
    name: "inventory",
    path: "/api/inventory/list",
    method: "GET",
    description: 
      "details of all products in inventory: stock levels, reorder status, expiry dates and products in shop information",
    params: {}
  },
  {
    name: "bill",
    path: "/api/bill/list",
    method: "GET",
    description: 
      "All billing details with time-based filters and customer related information",
    params: {
      filter: "time period in natural language (e.g., 'today', 'this week', 'this month', 'this year'). System auto-converts to: today/week/month/year. Default is all time if not provided.",
    },
    supportedRanges: ["today", "this week", "this month", "this year", "all"]
  }
];

