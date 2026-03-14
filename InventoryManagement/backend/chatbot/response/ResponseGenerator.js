import callLLM from "../llm/OllamaService.js";

async function generateResponse(context, query) {
  // 1. MINIFY CONTEXT: Limit the amount of data sent to the LLM to speed it up.
  // If the array is huge, only send the first 20-30 relevant items, or 
  // map them to remove unnecessary backend fields (like IDs, timestamps).
  const MAX_ITEMS = 30; 
  let optimizedContext = Array.isArray(context) ? context.slice(0, MAX_ITEMS) : [context];
  
  const safeContext = optimizedContext.map(c => 
    typeof c === 'string' ? c : JSON.stringify(c)
  ).join("\n");

  // 2. REWRITE PROMPT: Use strict instructions, formatting rules, and examples.
  const prompt = `
You are a highly efficient, robotic inventory data reporter. You speak in data, tables, and ultra-short sentences. 

CRITICAL RULES:
1. NO INTRODUCTIONS. Never say "Based on the data" or "Here is the list". 
2. NO CONCLUSIONS. Never summarize or offer unsolicited business advice.
3. START IMMEDIATELY with the answer.
4. If the user asks for a list, products, or data, output ONLY a concise Markdown table.
5. Maximum text length: 2 short sentences outside of tables.

Context Data:
${safeContext}

User Question:
"${query}"

Example Response for "show my products list":
| Product | Category | Price | Quantity | Expiry Date | supplier | notify days before expiry |
|---|---|---|---|---|---|---|---|
| Rava | Grocery | ₹50 | 45 | 10 | xx/xx/xxxx | xyz | 20 |
| Nodard | Medicine | ₹20 | 12 | 13 | xx/xx/xxxx | abc | 30 |

Example Response for "top selling product last year":
Your top-selling product was **Wheel-1/2Kg** (Grocery), generating ₹85,346 in profit.

Now, answer the User Question using ONLY the Context Data:
`;

  return callLLM(prompt);
}

export default generateResponse;