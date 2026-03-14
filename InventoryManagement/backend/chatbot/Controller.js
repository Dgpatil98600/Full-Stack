// backend/chatbot/chatbot.controller.js

import axios from "axios";
import callLLM from "./llm/OllamaService.js";
import { decideApiAndParams } from "./intent/IntentClassifier.js";
import { getCache, setCache } from "./memory/CacheMemory.js";
import DEFAULTS from "./config/Defaults.js"; 

function generateCacheKey(apiPath, params) {
  return `${apiPath}:${JSON.stringify(params)}`;
}

// 🚀 LIMIT TO 6 ITEMS & CLEAN BILLS: Guarantees no timeouts
function minifyDataForLLM(data) {
  if (!data) return "No data.";
  
  const cleanItem = (item) => {
    const c = { ...item };
    // Standardize keys for LLM readability
    if (!c.name && !c.Name) c.name = c.displayName || c.Product || "Unknown";
    if (c.customerName) c.customer = c.customerName; // Help LLM identify customers easily
    
    // 🚨 DELETE heavy nested arrays (like purchased items in bills) to prevent LLM timeouts
    delete c._id; delete c.id; delete c.createdAt; delete c.updatedAt; delete c.__v; delete c.user; delete c.displayName; delete c.items; 
    return c;
  };

  if (Array.isArray(data)) return data.slice(0, 6).map(cleanItem); 
  
  if (typeof data === 'object') {
    const cleanObj = { ...data };
    for (let key in cleanObj) {
      if (Array.isArray(cleanObj[key])) {
        cleanObj[key] = cleanObj[key].slice(0, 6).map(cleanItem);
      }
    }
    return cleanObj;
  }
  return data;
}

export default async function chatbotHandler(req, res) {
  const startTime = Date.now();
  try {
    const { message } = req.body;
    const authHeader = req.headers.authorization;

    console.log(`\n📨 Query: "${message}"`);
    const decision = await decideApiAndParams(message);

    // 1️⃣ Conversational Query
    if (!decision.api || !decision.api.path) {
      const chatPrompt = `User: "${message}"\nReply directly in 1 short sentence as a helpful assistant.`;
      const answer = await callLLM(chatPrompt, "llama3:8b", { num_predict: 50, temperature: 0.3 });
      return res.json({ apiUsed: "none", params: {}, answer, source: 'chat', responseTime: Date.now() - startTime });
    }

    console.log(`📡 API: ${decision.api.name}`);
    
    // 2️⃣ Setup API Call
    let finalParams = { ...(decision.params || {}) };
    if (Object.keys(finalParams).length === 0 || finalParams.range === 'all') {
      finalParams = { ...(DEFAULTS[decision.api.name] || {}), ...finalParams }; 
    }

    let apiPath = decision.api.path || '';
    if (apiPath.includes('/api/inventory')) apiPath = '/api/inventory/list';
    if (apiPath.toLowerCase().includes('/api/bill')) apiPath = '/api/bill/list';

    // 3️⃣ Fetch Data (with Cache)
    const cacheKey = generateCacheKey(apiPath, finalParams);
    let apiResponse;
    let usedCache = false;

    if (getCache(cacheKey)) {
      apiResponse = { data: getCache(cacheKey) };
      usedCache = true;
    } else {
      try {
        apiResponse = await axios({
          method: decision.api.method,
          url: `http://localhost:5000${apiPath}`,
          headers: { Authorization: authHeader },
          params: finalParams
        });
        setCache(cacheKey, apiResponse.data);
      } catch (err) {
        if (err.response?.status === 404) return res.json({ apiUsed: decision.api.name, answer: "Data not found.", source: 'fallback' });
        throw err;
      }
    }

    // 4️⃣ Generate Fast Response
    const minifiedData = minifyDataForLLM(apiResponse.data);
    
    // 🚀 DYNAMIC, SINGLE-CHOICE PROMPT: Forces the LLM to pick ONE format and stops multi-section spam
    const explainPrompt = `You are a fast inventory assistant. Answer the user's query using the JSON DATA.

CRITICAL RULES:
1. Choose EXACTLY ONE format below based on what the user wants. DO NOT output multiple sections.
   - If user asks for a LIST (products, customers, expiry): Output ONLY a Markdown table.
   - If user asks for SUGGESTIONS (new products): Output ONLY a Markdown table with 3-4 names and "Potential Gain".
   - If user asks for ADVICE (tips): Output exactly 2 short sentences. NO tables.
   - If user asks for METRICS (turnover, profit, specific customer names): Output 1-2 short sentences directly.
2. NO INTRODUCTIONS. Start immediately. Do not say "Here is the data".
3. Use ONLY the data provided. Do not hallucinate.

JSON DATA:
${JSON.stringify(minifiedData)}

USER QUERY:
"${message}"

RESPONSE:`;

    const answer = await callLLM(explainPrompt, "llama3:8b", { 
      num_predict: 250, 
      temperature: 0.1   
    });
    
    res.json({ apiUsed: decision.api.name, params: finalParams, answer, source: usedCache ? 'cache' : 'api', responseTime: Date.now() - startTime });
    
  } catch (error) {
    console.error("❌ Chatbot Error:", error.message);
    res.status(500).json({ error: "Failed to process request", message: error.message });
  }
}