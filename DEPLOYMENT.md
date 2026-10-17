# Deployment Guide: Next.js + Supabase Attendance Recording System

This guide walks you through deploying the **Employee Attendance Recording System** full-stack web application using **Next.js (App Router)**, **Supabase (PostgreSQL)**, and **Vercel**.

---

## 1. Prerequisites

Before starting, ensure you have:

1. A **[GitHub](https://github.com)** account (to store your code and connect to Vercel).
2. A free **[Supabase](https://supabase.com)** account (cloud PostgreSQL database).
3. A free **[Vercel](https://vercel.com)** account (for hosting the Next.js app).
4. Node.js 18+ installed on your local machine (optional, for local testing).

---

## 2. Step 1: Set Up Your Supabase Database

1. Log in to [Supabase](https://supabase.com/dashboard) and click **"New Project"**.
2. Fill in the details:
   - **Name:** e.g., `attendance-system`
   - **Database Password:** Choose a strong password and save it somewhere secure.
   - **Region:** Select **Singapore (`ap-southeast-1`)** for optimal latency in Malaysia.
   - **Pricing Plan:** Free tier.
3. Click **"Create new project"** and wait ~1-2 minutes for the database to provision.
4. Once ready, click on **SQL Editor** (icon on the left sidebar) $\to$ **New query**.
5. Copy the entire contents of [`supabase-schema.sql`](./supabase-schema.sql) and paste it into the query editor.
6. Click **Run** (or `Ctrl+Enter`).
   - You should see `Success. No rows returned`.
   - Your tables (`workers`, `settings`, `submissions`, `attendance`, `audit_logs`) and default settings are now created!
7. Retrieve your API Keys:
   - Go to **Project Settings** (gear icon on bottom left) $\to$ **API**.
   - Note down:
     - **Project URL** (`https://xyzcompany.supabase.co`)
     - **Project API Keys $\to$ `anon` / `public`** key
     - **Project API Keys $\to$ `service_role`** key *(Keep this secret; it is used only in server-side API routes)*.

---

## 3. Step 2: Local Testing (Optional)

1. Inside the `nextjs-app` directory, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123!
   SESSION_SECRET=a_random_32_character_string_for_signing_cookies

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Install dependencies and start the local development server:
   ```bash
   npm install
   npm run dev
   ```
4. Open your browser:
   - Worker Form: [http://localhost:3000](http://localhost:3000)
   - Admin Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
   - Admin Dashboard: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 4. Step 3: Deploy to Vercel

### Option A: Using the Vercel Dashboard (Recommended)

1. Push this project (or the `nextjs-app` folder) to a GitHub repository:

   ```bash
   git init
   git add .
   git commit -m "Initial commit of full-stack attendance app"
   git branch -M main
   git remote add origin https://github.com/your-username/attendance-app.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/new).
3. Click **"Add New..."** $\to$ **"Project"** and select your GitHub repository.
4. If `nextjs-app` is a subfolder in your repo:

   - Under **Root Directory**, click **Edit** and select `nextjs-app`.
5. Under **Environment Variables**, add the following 6 keys:

   | Key                               | Value                                  | Notes                                      |
   | --------------------------------- | -------------------------------------- | ------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxx.supabase.co`           | From Supabase Project Settings $\to$ API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...`                      | Public anon key from Supabase              |
   | `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGciOi...`                      | Secret service_role key from Supabase      |
   | `ADMIN_USERNAME`                | `admin`                              | Your desired admin username                |
   | `ADMIN_PASSWORD`                | `YourSecurePassword123!`             | Strong password for admin login            |
   | `SESSION_SECRET`                | *(Random 32+ character string)*      | Used to sign session tokens securely       |
   | `NEXT_PUBLIC_APP_URL`           | `https://your-deployment.vercel.app` | (Update after first deploy)                |
6. Click **Deploy**.
7. In ~60 seconds, your site is live! Vercel will provide your production URL (e.g., `https://attendance-app-xxx.vercel.app`).

---

## 5. Step 4: Verification & Admin Setup

1. **Open Admin Login**:
   - Go to `https://your-deployment.vercel.app/admin/login`.
   - Enter your `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
2. **Add Employees**:
   - In the Admin Dashboard, click **Add Worker / Tambah Pekerja**.
   - Enter their Name and Department (e.g., Operations, Finance, Logistics).
3. **Test Lock / Unlock Toggle**:
   - Click the **Lock Link / Kunci Pautan** button.
   - In an incognito tab, open the worker URL `https://your-deployment.vercel.app`.
   - Verify that it shows:
     > *"Attendance submission is currently closed. Please contact your administrator."*
     >
   - Unlock the link from the admin dashboard and refresh; the worker form should now load normally.
4. **Test Worker Submission**:
   - Select an employee name, choose the month and year.
   - Choose Present or Off Day for each date, set working hours, and submit.
   - Confirm the submission appears in the Admin dashboard under the selected month.
5. **Test Report Exports**:
   - Click **Export Excel (.xlsx)** or **Print / Export PDF** from the admin dashboard.

---

## 6. Maintenance & Operational FAQs

### How to reset the Admin Password?

Change the `ADMIN_PASSWORD` environment variable in your Vercel Project Settings (**Settings $\to$ Environment Variables**), then click **Redeploy**. Existing sessions will immediately require the new credentials.

### What happens when an employee leaves?

Go to the Admin Dashboard $\to$ **Workers**, click **Edit**, and set their status to **Inactive**.

- Inactive workers will **not** appear in the public worker submission dropdown.
- All historical attendance records for past months are preserved.

### Database Backups

Supabase provides automated daily backups for your database under **Project Settings $\to$ Database $\to$ Backups**.
