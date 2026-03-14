import axios from "axios";

const ollamaClient = axios.create({
  baseURL: "http://localhost:11434",
  timeout: 120000, 
  headers: { "Content-Type": "application/json" }
});

async function callLLM(prompt, model = "llama3:8b", customOptions = {}) {
  try {
    const startTime = Date.now();
    console.log(`🔄 Calling LLM (${model})...`);
    
    const defaultOptions = {
      temperature: 0.1,      
      top_k: 10,             
      // 👈 Restored Golden State: Bumped to 300 so Markdown tables finish without getting cut off
      num_predict: 300       
    };
    
    const res = await ollamaClient.post("/api/generate", {
      model,
      prompt,
      stream: false,
      options: { ...defaultOptions, ...customOptions }
    });

    if (!res.data.response) throw new Error("Empty response from LLM");

    const duration = Date.now() - startTime;
    console.log(`✓ LLM response generated (${res.data.response.length} chars) in ${duration}ms`);
    return res.data.response.trim();
  } catch (err) {
    console.error("❌ LLM Error:", err.message);
    return `I encountered an error: ${err.message}`;
  }
}

export default callLLM;