import axios from "axios";

const CHROMA_BASE = "http://localhost:8000/api/v2";
const COLLECTION = "inventory_rag";

// Create axios instance with timeout & retry config
const axiosClient = axios.create({
  baseURL: CHROMA_BASE,
  timeout: 30000, // 30 second timeout for long operations
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * Retry logic for failed requests
 */
async function retryRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retry ${i + 1}/${retries} after error:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // exponential backoff
    }
  }
}

/**
 * Internal helper – ensure collection exists
 */
async function ensureCollection() {
  try {
    await retryRequest(() => axiosClient.get(`/collections/${COLLECTION}`));
    return;
  } catch (err) {
    // If GET failed, try to create the collection using a couple of possible endpoints
    console.warn(`⚠ Collection '${COLLECTION}' not found (GET returned ${err.response?.status || err.message}). Attempting to create...`);
    const creationAttempts = [
      // Common: POST /collections { name }
      async () => axiosClient.post(`/collections`, { name: COLLECTION }),
      // Fallback: POST /collections/{name}
      async () => axiosClient.post(`/collections/${COLLECTION}`)
    ];

    for (let i = 0; i < creationAttempts.length; i++) {
      try {
        const resp = await retryRequest(() => creationAttempts[i]());
        console.log(`✓ Collection '${COLLECTION}' created (method ${i + 1})`, resp.status);
        return;
      } catch (createErr) {
        console.warn(`Attempt ${i + 1} to create collection failed:`, createErr.response?.status || createErr.message);
        // continue to next attempt
      }
    }

    // If we reach here, all creation attempts failed
    const errMsg = `Failed to create collection '${COLLECTION}' via known endpoints`;
    console.error(`✗ ${errMsg}`);
    throw new Error(errMsg);
  }
}

/**
 * Add documents to RAG collection
 */
async function add({ ids, documents, metadatas }) {
  await ensureCollection();
  
  try {
    await retryRequest(() =>
      axiosClient.post(
        `/collections/${COLLECTION}/add`,
        { 
          ids, 
          documents, 
          metadatas 
        }
      )
    );
    console.log(`✓ Added ${ids.length} documents to RAG`);
  } catch (err) {
    console.error(`✗ Failed to add documents:`, err.response?.data || err.message);
    throw err;
  }
}

/**
 * Query RAG collection
 */
async function query({ queryTexts, nResults = 3, where = {} }) {
  await ensureCollection();

  try {
    const res = await retryRequest(() =>
      axiosClient.post(
        `/collections/${COLLECTION}/query`,
        {
          query_texts: Array.isArray(queryTexts) ? queryTexts : [queryTexts],
          n_results: nResults,
          where: where,
          include: ["documents", "metadatas", "distances"]
        }
      )
    );
    // Normalize multiple possible response shapes from different Chroma versions
    const data = res.data || {};
    let documents = [];

    // Common shape: { documents: [[...]] }
    if (Array.isArray(data.documents) && Array.isArray(data.documents[0])) {
      documents = data.documents[0];
    }

    // Some servers return { documents: [...] }
    else if (Array.isArray(data.documents)) {
      documents = data.documents;
    }

    // Another possible shape: { result: { documents: [...] } }
    else if (data.result && Array.isArray(data.result.documents)) {
      documents = data.result.documents;
    }

    // As a last resort, inspect `res.data` for any array values
    else {
      const arr = Object.values(data).find(v => Array.isArray(v));
      if (arr) documents = arr;
    }

    return documents || [];
  } catch (err) {
    console.error(`✗ Query failed:`, err.response?.data || err.message, 'status:', err.response?.status);
    return []; // Return empty array instead of throwing to allow graceful fallback
  }
}

/**
 * Delete collection (for cleanup/testing)
 */
async function deleteCollection() {
  try {
    await retryRequest(() => axiosClient.delete(`/collections/${COLLECTION}`));
    console.log(`✓ Collection '${COLLECTION}' deleted`);
  } catch (err) {
    console.warn(`Note: Delete failed (may not exist):`, err.message);
  }
}

/**
 * EXPORT: behaves like a collection object
 */
const collection = {
  add,
  query,
  deleteCollection,
  ensureCollection
};

export default collection;
