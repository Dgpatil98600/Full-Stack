# Inventory Management System

This project is a full-stack Inventory Management System built with React (frontend) and Node.js/Express (backend), featuring robust inventory, billing, analytics, notifications, and an AI-powered chatbot assistant.

## Features

### User Management
- User registration with OTP verification (Twilio SMS) and document upload
- Secure login and authentication (JWT-based)
- User profile management (update shop details, contact info, etc.)
- Toast notifications for profile update success/failure (using react-toastify)

### User Data Isolation (Multi-Tenancy)
- Every user operates in a fully isolated environment — each user sees only their own data
- All database queries are scoped by authenticated `user.id`:
  - Products, bills, notifications, and analytics are filtered per user
  - No cross-user data leakage across any API endpoint
- The chatbot assistant is also user-scoped:
  - API calls made by the chatbot forward the user's auth token
  - RAG retrieval filters documents by `ownerId` (ChromaDB `where` clause)
  - Cache keys are per-request (based on API path + params), ensuring no shared cache between users
- Protected routes use JWT middleware — unauthenticated requests are rejected

### Inventory Management
- Add, update, and delete products with details (name, SKU, category, prices, quantity, supplier, expiration, etc.)
- Search and filter products by name, display name, SKU, and category
- Group products by category and display name
- Automatic notifications for low stock (reorder alerts) and product expiry
- Upload and manage product images
- Stock validation on billing — prevents exceeding available inventory
- Toast notifications for user feedback on product operations (add, update, delete) using react-toastify

### Billing System
- Generate bills for customers with multiple products and quantities
- Real-time stock validation: inline error messages when quantity exceeds available stock
- Increment/decrement buttons with automatic disabling at stock limits
- Bill creation blocked if any item exceeds available inventory (with detailed error messages)
- Calculate grand total and net quantity automatically
- View, filter, and manage bill history (by day, week, month, year, or all)
- Print and save bills as PDF (using react-to-print and jsPDF)

### Product Analysis & Dashboard
- Visualize top-selling and most profitable products over custom or preset date ranges
- Filter analytics by product category and time range (1m, 3m, 6m, 1y, 3y, 4y, 5y, all, custom)
- Dashboard with quick access to billing, inventory, analytics, and notifications
- Charts powered by Recharts (BarChart, ResponsiveContainer, etc.)

### Shop Analysis & Performance Metrics
- Real-time financial metrics dashboard:
  - Total Profit Tracking
  - Current Stock Value Monitoring
  - Live Turnover Analysis
  - Potential Gain Calculations
- Daily Sales & Profit Analysis:
  - Interactive line chart visualization
  - Month-wise sales and profit tracking
  - Daily performance metrics with data points
  - Customizable month selection (e.g., Jul-24, Aug-24, Sep-24)
  - Visual indicators for daily performance
  - Automatic updates when new bills are created
- Data Visualization:
  - Interactive line charts using Recharts
  - Bullet points for daily metrics
  - Smooth animations using Framer Motion
- Filtering Capabilities:
  - Month-wise data filtering
  - Historical data comparison
  - Custom date range selection

### Notifications
- Real-time notifications for low stock and product expiry
- View, filter, and delete notifications by type (reorder, expiry, all)
- Toast notifications for user feedback on notification actions (using react-toastify)

### AI-Powered Inventory Assistant (Chatbot)
- **Powered by Ollama (LLaMA 3 8B)** running locally — no external API dependency
- **Architecture:** Intent Classification + Live Data Fetching + LLM Response Generation
- **RAG Pipeline (ChromaDB):**
  - Document ingestion with per-user isolation (`ownerId` metadata)
  - Vector similarity retrieval (top 5 results) with user-scoped filtering
  - ChromaDB v2 REST API with retry logic and version compatibility
- **Intent Classification:**
  - LLM-based routing (not rule-based) — sends user message to LLaMA 3 with API catalog
  - Classifies into respective API with params
- **Live Data Queries:**
  - In-memory cache (1-hour TTL) to reduce redundant API calls
- **Features:**
  - Real-time inventory data analysis
  - Smart product recommendations
  - Helps in making real inventory Decisions
  - Inventory optimization suggestions
  - Natural language interactions about stock levels, sales patterns, product performance, reorder recommendations
  - Context-aware responses based on live inventory data
  - Structured output formatting (tables, sentences, or metrics — chosen by LLM)
- **Performance:** Two LLM calls per data query (intent + answer), one for conversational queries
- **RAG (Retrieval-Augmented Generation):**
  - ChromaDB vector database with cosine similarity search
  - Document ingestion — serializes inventory items to JSON, tags each with `ownerId` for per-user isolation
  - Context retrieval — top-5 similarity search filtered by user, with graceful fallback on empty results
  - RAG response generator — takes retrieved context + user query, produces Markdown-formatted answers
  - Retry logic (3 attempts with backoff) and multi-version Chroma response handling
  - Infrastructure fully built and ready for integration alongside live data fetching
- **Handel Normals conversation aand all types queries**

### Payments
- Razorpay integration for payment during registration (if enabled)

### Scheduled Tasks (Backend)
- Uses **node-cron** to schedule and automate backend notifications:
  - **Expiry notifications:** Periodically checks for products nearing expiry and sends alerts via Twilio SMS
  - **Reorder notifications:** Periodically checks for products below reorder level and sends alerts

### Security & Logging
- JWT authentication for protected routes
- Per-user data isolation across all API endpoints
- Request and error logging for backend API

---

## Technology Stack

### Frontend
- **React** — UI framework
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Charts (BarChart, LineChart, ResponsiveContainer)
- **react-to-print** — Print bills
- **jsPDF** — Save bills as PDF
- **remix-icons** — Dashboard/profile icons
- **react-icons** — Chat icons (RiSendPlane2Fill, etc.)
- **GSAP** — Dashboard animations
- **Framer Motion** — Smooth page/component animations
- **react-toastify** — Toast notifications for user feedback
- **re-resizable** — Adjustable chat panel

### Backend
- **Node.js / Express** — Server framework
- **MongoDB / Mongoose** — Database and ODM
- **JWT (jsonwebtoken)** — Authentication
- **Multer** — File uploads
- **Twilio** — SMS OTP and notification delivery
- **Razorpay** — Payment integration
- **node-cron** — Scheduled tasks (expiry/reorder checks)
- **bcryptjs** — Password hashing

### AI / Chatbot
- **Ollama** — Local LLM runtime (LLaMA 3 8B model)
- **ChromaDB** — Vector database for RAG pipeline
- **Axios** — Internal API calls from chatbot to backend

---

## Filters & UI Libraries Used

- **Filters:**
  - Inventory: Search/filter by name, display name, SKU, category
  - Bills: Filter by time period (today, week, month, year, all)
  - Product Analysis: Filter by time range and product category
  - Shop Analysis: Returns inventory information and monthly sales & profit
  - Notifications: Filter by type (all, reorder, expiry)
  - Profile: Show user profile
- **UI Libraries:**
  - **remix-icons:** Used for dashboard/profile icons
  - **Framer Motion:** Used for smooth animations
  - **react-icons:** Used in chat (e.g., RiSendPlane2Fill)
  - **Recharts:** Used for product analysis and shop analysis charts
  - **re-resizable:** For adjustable chat panel
  - **react-to-print:** Print bills
  - **jsPDF:** Save bills as PDF
  - **GSAP:** Animations in dashboard
  - **react-toastify:** Toast notifications for user feedback

---
