import { DEFAULTS } from "../config/Defaults.js";

export default function buildQuery(api, userId, filters = {}) {
  const finalFilters = { ...DEFAULTS[api], ...filters };

  switch (api) {
    case "inventory":
      return { endpoint: "/api/inventory", params: {} };

    case "bill":
      return {
        endpoint: "/api/bill",
        params: { filter: finalFilters.filter }
      };

    case "product-analysis":
      return {
        endpoint: "/api/product-analysis",
        params: {
          range: finalFilters.range,
          category: finalFilters.category
        }
      };

    case "shop-analysis":
      return {
        endpoint: "/api/shop-analysis",
        params: finalFilters.month ? { month: finalFilters.month } : {}
      };

    default:
      return null;
  }
}
