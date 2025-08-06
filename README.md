# Inventory Management System

This project is a full-stack Inventory Management System built with React (frontend) and Node.js/Express (backend), featuring robust inventory, billing, analytics, and notification capabilities.

## Features

### User Management
- User registration with OTP verification and document upload
- Secure login and authentication (JWT-based)
- User profile management (update shop details, contact info, etc.)
- Toast notifications for profile update success/failure (using react-toastify)

### Inventory Management
- Add, update, and delete products with details (name, SKU, category, prices, quantity, supplier, expiration, etc.)
- Search and filter products by name, display name, SKU, and category
- Group products by category and display name
- Automatic notifications for low stock (reorder alerts) and product expiry
- Upload and manage product images
- **Toast notifications** for user feedback on product operations (add, update, delete) using react-toastify

### Billing System
- Generate bills for customers with multiple products and quantities
- Calculate grand total and net quantity automatically
- View, filter, and manage bill history (by day, week, month, year, or all)
- Print and save bills as PDF (using react-to-print and jsPDF)
- Filter bills by time period (today, week, month, year, all)

### Product Analysis & Dashboard
- Visualize top-selling and most profitable products over custom or preset date ranges
- Filter analytics by product category and time range (1m, 3m, 6m, 1y, 3y, 4y, 5y, all, custom)
- Dashboard with quick access to billing, inventory, analytics, and notifications
- Charts powered by Recharts (BarChart, ResponsiveContainer, etc.)

### Notifications
- Real-time notifications for low stock and product expiry
- View, filter, and delete notifications by type (reorder, expiry, all)
- **Toast notifications** for user feedback on notification actions (using react-toastify)

### AI Suggestions (Chat)
- Built-in AI chat assistant UI for business/product suggestions based on sales history
- **Note:** Currently, only the UI for AI chat is present. The full AI-powered process and backend integration may be implemented in the future.
- Uses react-icons for chat UI (e.g., RiSendPlane2Fill)

### Payments
- Razorpay integration for payment during registration (if enabled)

### Scheduled Tasks (Backend)
- Uses **node-cron** to schedule and automate backend notifications:
  - **Expiry notifications:** Periodically checks for products nearing expiry and sends alerts
  - **Reorder notifications:** Periodically checks for products below reorder level and sends alerts

### Security & Logging
- JWT authentication for protected routes
- Request and error logging for backend API

### Technology Stack & UI Libraries
- **Frontend:** React, Tailwind CSS, Recharts (charts), react-to-print, jsPDF, remix-icons, react-icons, GSAP (animations), **react-toastify** (toasts for product/profile/notification actions)
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Multer, Nodemailer, Twilio, Razorpay, **node-cron** (scheduled expiry/reorder notifications)

---

## Filters & UI Libraries Used

- **Filters:**
  - Inventory: Search/filter by name, display name, SKU, category
  - Bills: Filter by time period (today, week, month, year, all)
  - Product Analysis: Filter by time range and product category
  - Notifications: Filter by type (all, reorder, expiry)
- **UI Libraries:**
  - **remix-icons:** Used for dashboard/profile icons
  - **react-icons:** Used in chat (e.g., RiSendPlane2Fill)
  - **Recharts:** Used for product analysis charts (BarChart, etc.)
  - **react-to-print:** Print bills
  - **jsPDF:** Save bills as PDF
  - **GSAP:** Animations in dashboard
  - **react-toastify:** Toast notifications for user feedback on product/profile/notification actions
- **Backend Libraries:**
  - **node-cron:** For scheduled/recurring backend tasks like expiry and reorder notifications

---