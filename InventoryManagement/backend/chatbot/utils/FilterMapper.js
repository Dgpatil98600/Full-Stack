/**
 * Dynamic Filter Mapper
 * Converts natural language filter expressions to API-specific formats
 * without hardcoding - adapts intelligently to different API requirements
 */

/**
 * API-specific filter mappers
 * Each API defines how to transform natural language filters to its expected format
 */
const API_FILTER_SCHEMAS = {
  "product-analysis": {
    paramName: "range",
    typeFormat: "shorthand", // Uses shorthand codes like 1m, 3m, 6m, etc.
    converter: (naturalLanguageFilter) => {
      const normalized = normalizeLanguage(naturalLanguageFilter);
      const mapping = {
        "today": "1m", // Fallback to 1 month
        "this week": "1m",
        "week": "1m",
        "1 week": "1m",
        "last week": "1m",
        "this month": "1m",
        "1 month": "1m",
        "last month": "1m",
        "1m": "1m",
        "3 months": "3m",
        "last 3 months": "3m",
        "quarter": "3m",
        "last quarter": "3m",
        "3m": "3m",
        "6 months": "6m",
        "last 6 months": "6m",
        "half year": "6m",
        "6m": "6m",
        "1 year": "1y",
        "last year": "1y",
        "yearly": "1y",
        "1y": "1y",
        "3 years": "3y",
        "last 3 years": "3y",
        "3y": "3y",
        "4 years": "4y",
        "last 4 years": "4y",
        "4y": "4y",
        "5 years": "5y",
        "last 5 years": "5y",
        "5y": "5y",
        "all": "all",
        "all time": "all",
        "entire": "all"
      };
      return mapping[normalized] || "1m"; // Default to 1 month
    }
  },

  "shop-analysis": {
    paramName: "month",
    typeFormat: "yyyy-mm", // Expects YYYY-MM format
    converter: (naturalLanguageFilter) => {
      const normalized = normalizeLanguage(naturalLanguageFilter);
      const now = new Date();
      
      const mapping = {
        "today": getYYYYMM(now), // Current month
        "this month": getYYYYMM(now),
        "current month": getYYYYMM(now),
        "last month": getYYYYMM(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        "previous month": getYYYYMM(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        "1 month ago": getYYYYMM(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        "this week": getYYYYMM(now), // Current month
        "last week": getYYYYMM(now), // Current month
        "1 week ago": getYYYYMM(now), // Current month
      };
      
      // If it's already in YYYY-MM format, return as-is
      if (/^\d{4}-\d{2}$/.test(normalized)) {
        return normalized;
      }
      
      return mapping[normalized] || getYYYYMM(now); // Default to current month
    }
  },

  "bill": {
    paramName: "filter",
    typeFormat: "label", // Uses label format like 'today', 'week', 'month', 'year'
    converter: (naturalLanguageFilter) => {
      const normalized = normalizeLanguage(naturalLanguageFilter);
      const mapping = {
        "today": "today",
        "this day": "today",
        "24 hours": "today",
        "recent": "week",
        "week": "week",
        "this week": "week",
        "last week": "week",
        "1 week ago": "week",
        "7 days": "week",
        "month": "month",
        "this month": "month",
        "last month": "month",
        "1 month ago": "month",
        "30 days": "month",
        "year": "year",
        "yearly": "year",
        "this year": "year",
        "last year": "year",
        "1 year ago": "year",
        "12 months": "year",
        "annual": "year"
      };
      return mapping[normalized] || undefined; // Let backend apply default if not found
    }
  },

  "inventory": {
    paramName: null, // Inventory doesn't have filter params
    typeFormat: "none"
  }
};

/**
 * Normalize natural language to lowercase with consistent spacing
 */
function normalizeLanguage(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/[^\w\s\-]/g, ""); // Remove special chars except dash
}

/**
 * Convert date to YYYY-MM format
 */
function getYYYYMM(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Main function: Map parameters based on API name
 * Intelligently converts any filter parameter to the correct API format
 * 
 * @param {string} apiName - Name of the API (from decision.api.name)
 * @param {object} params - Raw parameters from LLM decision
 * @returns {object} - Transformed parameters with correct API format
 */
export function mapFiltersForAPI(apiName, params) {
  if (!params || typeof params !== "object") {
    return {};
  }

  const schema = API_FILTER_SCHEMAS[apiName];
  if (!schema || schema.typeFormat === "none") {
    return params; // No filter mapping needed
  }

  const mappedParams = { ...params };
  
  // Look for any time-based filter in params (could be named anything)
  // This makes it adaptive to different param names
  const timeFilterKeys = ["range", "month", "filter", "time", "period", "duration", "timeframe"];
  let filterValue = null;
  let filterKey = null;

  for (const key of timeFilterKeys) {
    if (params[key]) {
      filterValue = params[key];
      filterKey = key;
      break;
    }
  }

  // If we found a filter value, convert it using this API's converter
  if (filterValue && schema.converter) {
    const convertedValue = schema.converter(filterValue);
    
    // Use the API's expected parameter name
    if (schema.paramName) {
      // Remove any old keys
      timeFilterKeys.forEach(k => delete mappedParams[k]);
      // Set with correct name
      if (convertedValue) {
        mappedParams[schema.paramName] = convertedValue;
      }
    }
  }

  return mappedParams;
}

/**
 * Get all supported filter formats for documentation
 */
export function getFilterDocumentation() {
  return Object.entries(API_FILTER_SCHEMAS).reduce((doc, [apiName, schema]) => {
    if (schema.typeFormat !== "none") {
      doc[apiName] = {
        paramName: schema.paramName,
        format: schema.typeFormat,
        supportedValues: schema.typeFormat === "shorthand" 
          ? ["1m", "3m", "6m", "1y", "3y", "4y", "5y", "all"]
          : schema.typeFormat === "yyyy-mm"
          ? "YYYY-MM (e.g., 2024-02)"
          : schema.typeFormat === "label"
          ? ["today", "week", "month", "year"]
          : "variable"
      };
    }
    return doc;
  }, {});
}
