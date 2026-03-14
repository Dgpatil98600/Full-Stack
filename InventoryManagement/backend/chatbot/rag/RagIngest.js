import collection from "./ChromaClient.js";

async function ingestToRAG(data, ownerId) {
  const docs = data.map((item, i) => ({
    id: `${ownerId}_${i}`,
    document: JSON.stringify(item),
    metadata: { ownerId }
  }));

  console.log(`📥 Preparing to ingest ${docs.length} documents for ownerId: ${ownerId}`);
  try {
    await collection.add({
      ids: docs.map(d => d.id),
      documents: docs.map(d => d.document),
      metadatas: docs.map(d => d.metadata)
    });
    console.log(`✓ Ingested ${docs.length} documents to RAG for ownerId: ${ownerId}`);
  } catch (err) {
    console.error('✗ Ingestion failed:', err.message || err);
    throw err;
  }
}

export default ingestToRAG;
