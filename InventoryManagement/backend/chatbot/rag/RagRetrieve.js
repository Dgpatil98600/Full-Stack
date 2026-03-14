import collection from "./ChromaClient.js";

async function retrieveContext(query, ownerId) {
  try {
    const documents = await collection.query({
      queryTexts: [query],
      nResults: 5,
      where: { ownerId }
    });
    
    // If no results found, return a helpful message
    if (!documents || documents.length === 0) {
      console.warn(`⚠ No context found for ownerId: ${ownerId}`);
      return ["No relevant context found in database."];
    }

    // Normalize documents to strings to avoid [object Object] in prompts
    const normalized = documents.map(d => {
      if (typeof d === 'string') return d;
      try {
        return JSON.stringify(d);
      } catch (e) {
        return String(d);
      }
    });

    console.log(`✓ Retrieved ${normalized.length} context chunks`);
    return normalized;
  } catch (err) {
    console.error("❌ Context retrieval failed:", err.message);
    return ["Unable to retrieve context from database."];
  }
}

export default retrieveContext;
