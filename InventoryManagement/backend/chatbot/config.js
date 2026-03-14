/**
 * Chatbot Configuration Constants
 * Centralized configuration for all chatbot services
 * 
 * USAGE: import CONFIG from './config.js'
 */

const CONFIG = {
  // ===== Chroma DB Configuration =====
  CHROMA: {
    BASE_URL: "http://localhost:8000",
    API_VERSION: "v1",
    COLLECTION_NAME: "inventory_rag",
    TIMEOUT: 30000, // 30 seconds
    RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second base delay (exponential backoff)
    
    // Collection settings
    COLLECTION_CONFIG: {
      hnsw: {
        space: "cosine" // or "l2", "ip"
      }
    }
  },

  // ===== Ollama LLM Configuration =====
  OLLAMA: {
    BASE_URL: "http://localhost:11434",
    API_VERSION: "v1",
    DEFAULT_MODEL: "llama3:8b",
    TIMEOUT: 120000, // 2 minutes (LLM can be slow)
    
    // Alternative models (faster/lighter)
    MODELS: {
      FAST: "mistral",
      LIGHT: "neural-chat",
      TINY: "tinyllama",
      STANDARD: "llama3:8b"
    }
  },

  // ===== MongoDB Configuration =====
  MONGODB: {
    COLLECTIONS: {
      PRODUCTS: "products",
      USERS: "users",
      BILLS: "bills",
      CONVERSATIONS: "conversations"
    }
  },

  // ===== Cache Configuration =====
  CACHE: {
    TYPE: "memory", // "memory" or "redis"
    TTL: null, // null = session-based (clear on restart)
    
    // If switching to Redis:
    // REDIS_URL: "redis://localhost:6379",
    // REDIS_NAMESPACE: "chatbot:",
    // REDIS_TTL: 3600 // 1 hour
  },

  // ===== Intent Classifier Configuration =====
  INTENT: {
    CATEGORIES: {
      PRODUCTS: "products",
      INVENTORY: "inventory",
      BILLS: "bills",
      ANALYSIS: "analysis",
      HELP: "help",
      UNKNOWN: "unknown"
    }
  },

  // ===== RAG Configuration =====
  RAG: {
    N_RESULTS: 5, // Number of context documents to retrieve
    SIMILARITY_THRESHOLD: 0.5, // Only return results above this threshold
    
    // Metadata structure for documents
    METADATA_FIELDS: ["ownerId", "type", "category", "timestamp"]
  },

  // ===== Response Generation Configuration =====
  RESPONSE: {
    MAX_LENGTH: 2000, // Max characters in response
    FALLBACK_RESPONSE: "I'm unable to process your request right now. Please try again later.",
    
    // Response templates
    TEMPLATES: {
      NO_CONTEXT: "I don't have enough information to answer that question.",
      NO_LLM: "The language model service is currently unavailable.",
      ERROR: "An error occurred while processing your request."
    }
  },

  // ===== Logging Configuration =====
  LOG: {
    LEVEL: "info", // "debug", "info", "warn", "error"
    FORMAT: "json", // "json" or "text"
    
    // Console colors
    COLORS: {
      DEBUG: "\x1b[36m",    // Cyan
      INFO: "\x1b[32m",     // Green
      WARN: "\x1b[33m",     // Yellow
      ERROR: "\x1b[31m",    // Red
      RESET: "\x1b[0m"
    }
  },

  // ===== Performance Configuration =====
  PERFORMANCE: {
    ENABLE_CACHING: true,
    ENABLE_COMPRESSION: true,
    MAX_REQUEST_SIZE: "1mb",
    
    // Request timeout settings
    TIMEOUT_SETTINGS: {
      CHROMA_QUERY: 30000,
      CHROMA_INGEST: 45000,
      OLLAMA_GENERATE: 120000,
      DATABASE_QUERY: 10000,
      TOTAL_REQUEST: 180000 // 3 minutes total
    }
  },

  // ===== Feature Flags =====
  FEATURES: {
    ENABLE_CONVERSATION_HISTORY: true,
    ENABLE_RETRY_LOGIC: true,
    ENABLE_ERROR_FALLBACK: true,
    ENABLE_DETAILED_LOGGING: true,
    
    // Debug modes
    DEBUG_RAG: false,
    DEBUG_LLM: false,
    DEBUG_INTENT: false
  }
};

// Utility function to validate configuration
export function validateConfig() {
  const issues = [];
  
  // Check Chroma URL
  if (!CONFIG.CHROMA.BASE_URL.includes('localhost') && !CONFIG.CHROMA.BASE_URL.includes('127.0.0.1')) {
    issues.push("⚠️  Chroma base URL might not be accessible");
  }
  
  // Check Ollama URL
  if (!CONFIG.OLLAMA.BASE_URL.includes('localhost') && !CONFIG.OLLAMA.BASE_URL.includes('127.0.0.1')) {
    issues.push("⚠️  Ollama base URL might not be accessible");
  }
  
  if (issues.length > 0) {
    console.warn("Configuration Warnings:", issues);
  }
  
  return issues.length === 0;
}

// Utility function to get service URL
export function getServiceUrl(service, endpoint = "") {
  const services = {
    chroma: `${CONFIG.CHROMA.BASE_URL}/api/${CONFIG.CHROMA.API_VERSION}${endpoint}`,
    ollama: `${CONFIG.OLLAMA.BASE_URL}${endpoint}`,
    mongodb: CONFIG.MONGODB.DB_URL
  };
  
  return services[service] || null;
}

// Utility function to log with timestamp
export function logWithTimestamp(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const levelColor = CONFIG.LOG.COLORS[level.toUpperCase()] || CONFIG.LOG.COLORS.INFO;
  const reset = CONFIG.LOG.COLORS.RESET;
  
  console.log(
    `${levelColor}[${timestamp}] ${level.toUpperCase()}${reset}`,
    message,
    Object.keys(data).length > 0 ? data : ""
  );
}

export default CONFIG;
