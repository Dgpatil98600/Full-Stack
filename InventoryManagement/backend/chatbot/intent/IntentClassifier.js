// backend/chatbot/intent/intent.classifier.js

import callLLM from "../llm/OllamaService.js";
import { API_CATALOG } from "../config/APICatalog.js";
import { mapFiltersForAPI } from "../utils/FilterMapper.js";

export async function decideApiAndParams(userMessage) {
  const prompt = `You are a fast API router. Output ONLY valid JSON.

API ROUTING RULES:
- "show products", "list inventory", "stock", "expire", "margin" -> "inventory"
- "profit", "turnover", "shop status", "balance" -> "shop-analysis"
- "top selling", "sales performance", "best product" -> "product-analysis"
- "bills", "invoices", "customers", "frequent customer", "who bought" -> "bill"
- Conversational (hello, hi, thanks) -> return { "api": null, "params": {} }

PARAMETER RULES (CRITICAL):
- ONLY extract parameters that are supported by the chosen API.
- For "bill", the ONLY valid parameter key is "filter" (e.g., "last month", "today").
- For "product-analysis", the ONLY valid parameter key is "range" (e.g., "last month").
- For "shop-analysis", the ONLY valid parameter key is "month".
- If no time frame is mentioned, leave params as {}.

APIs:
${JSON.stringify(API_CATALOG.map(a => ({ name: a.name, path: a.path, method: a.method, params: a.params }))) }

User Query: "${userMessage}"

Output JSON Format: { "api": { "name": "...", "path": "...", "method": "GET" }, "params": {} }`;

  const raw = await callLLM(prompt, "llama3:8b", { num_predict: 100, temperature: 0 });

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const decision = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    
    if (!decision.api || !decision.api.name) return { api: null, params: {} };
    
    decision.params = mapFiltersForAPI(decision.api.name, decision.params || {});
    return decision;
  } catch (err) {
    console.error("❌ Intent parsing failed");
    return { api: null, params: {} };
  }
}