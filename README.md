# Employee Attendance Recording System (Full-Stack Next.js App)

A modern full-stack web application replacing the Google Apps Script version with **Next.js 14 App Router**, **Supabase (PostgreSQL)**, **Tailwind CSS**, and **Lucide Icons**, designed for seamless deployment on **Vercel**.

---

## 🚀 Key Features

- **Public Worker Attendance Form (`/`)**:
  - No Google login required for workers.
  - Dropdown of active employees and month/year selector (`Asia/Kuala_Lumpur`).
  - Batch daily attendance logging for the whole month (*Present / Hadir*, *Off Day / Hari Cuti*, *Sick Leave*, etc.).
  - Auto-fill helpers (standard 9am–6pm hours, mark weekdays present).
  - Pre-submission summary & confirmation modal.
  - Automatic load and atomic overwrite of previously submitted months.
  - Server-enforced lock check: if locked, displays friendly closed notice.
- **Bilingual Interface**:
  - Instant toggle between **English (EN)** and **Bahasa Melayu (BM)** across all screens.
- **Protected Admin Dashboard (`/admin`)**:
  - Secure credential login with HTTP-only signed session cookies.
  - One-click **Lock / Unlock Submission Link** control with confirmation modal.
  - Overview metric cards: Active Employees, Completed, Pending, Incomplete, and Completion Rate %.
  - Search by worker name/department and filter by status.
  - Employee Management: Add, Edit, and Deactivate/Reactivate workers.
  - Monthly attendance inspection and correction with audit logging.
  - One-click **Excel (.xlsx)** export for the whole organization or single worker.
- **Database & Architecture**:
  - Supabase PostgreSQL with relational foreign keys, unique period constraints, indexes, and audit logs.
  - Built-in Next.js App Router API Route Handlers.

---

## 📖 Deployment Guide

For the full step-by-step guide to set up Supabase and deploy to Vercel, see:
👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

The PostgreSQL database setup script is ready in:
👉 **[supabase-schema.sql](./supabase-schema.sql)**

---

## 💻 Local Development

1. Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
