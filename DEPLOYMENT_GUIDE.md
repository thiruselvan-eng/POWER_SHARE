# PowerShare — Complete Online Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions to deploy the entire **PowerShare** application to production online:

- **Database:** Render PostgreSQL (or Supabase / Neon)
- **Backend:** Render Web Service (Spring Boot, Java 21, Docker)
- **Frontend:** Vercel (Vite + React + Tailwind CSS)

---

## 📐 Deployment Architecture Overview

```
┌─────────────────────────┐          ┌──────────────────────────────┐          ┌───────────────────────────┐
│     Vercel Frontend     │  HTTPS   │    Render Backend Web App    │  JDBC    │  Render PostgreSQL DB     │
│   (Vite + React App)    │ ───────> │    (Spring Boot + Docker)     │ ───────> │  (Managed PostgreSQL DB)  │
│  https://*.vercel.app   │          │   https://*.onrender.com     │          │  port 5432 / sslmode      │
└─────────────────────────┘          └──────────────────────────────┘          └───────────────────────────┘
```

---

## 🗄️ Step 1: Managed PostgreSQL Database Setup (Render)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **PostgreSQL**.
3. Configure the database details:
   - **Name:** `powershare-db`
   - **Database:** `powershare`
   - **User:** `powershare_user`
   - **Region:** Choose the region closest to your users (e.g., Singapore, Frankfurt, Oregon).
   - **PostgreSQL Version:** 15 or 16
   - **Instance Type:** Free (or Starter for production uptime)
4. Click **Create Database**.
5. Once created, save the following credentials from the database dashboard:
   - **Internal Database URL** (for Render backend)
   - **External Database URL** (for local admin/psql migration)
   - **Hostname, Database Name, Username, Password, Port**

### Run Schema Migration (One-Time Setup)

Connect to your database using `psql` or DBeaver using the **External Database URL**:

```bash
psql "postgres://powershare_user:YOUR_PASSWORD@dpg-xxxxxx.render.com/powershare?sslmode=require" -f backend/migrate.sql
```

*(This ensures all enum constraints, legacy nullable column fixes, and custom indices are pre-applied).*

---

## ⚙️ Step 2: Deploy Backend to Render (Spring Boot)

### Option A: Automatic Docker Build (Recommended)

1. Push your repository to **GitHub**.
2. On the [Render Dashboard](https://dashboard.render.com/), click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the build settings:
   - **Name:** `powershare-backend`
   - **Region:** Same region as your database
   - **Branch:** `main` (or `master`)
   - **Root Directory:** `backend`
   - **Runtime:** **Docker**
   - **Dockerfile Path:** `Dockerfile`
   - **Instance Type:** Free (or Starter)

### Option B: Maven Native Build

If not using Docker:
- **Runtime:** `Java`
- **Build Command:** `./mvnw clean package -DskipTests`
- **Start Command:** `java -jar target/backend-0.0.1-SNAPSHOT.jar`

### Environment Variables Configuration on Render

In your Web Service settings, go to **Environment** → **Add Environment Variable** and add:

| Environment Variable | Recommended Production Value / Description |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<RENDER_INTERNAL_HOST>:5432/powershare?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `<YOUR_RENDER_DB_USER>` |
| `SPRING_DATASOURCE_PASSWORD` | `<YOUR_RENDER_DB_PASSWORD>` |
| `JWT_SECRET` | Generate a 64+ char random hex string (e.g., `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name (or `demo`) |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret |
| `PORT` | `8085` (or let Render set it automatically via `$PORT`) |

Click **Deploy Web Service**.

Once deployed, copy your live backend URL (e.g., `https://powershare-backend.onrender.com`).

---

## 🌐 Step 3: Deploy Frontend to Vercel (React + Vite)

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and set to `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Expand **Environment Variables** and add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://powershare-backend.onrender.com/api` | Points frontend API client to Render backend |

6. Click **Deploy**.

### Single Page Application (SPA) Routing Verification

Ensure `frontend/vercel.json` exists in your repository so Vite client-side routing works on full page refreshes:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 🔒 Step 4: Production CORS & Security Check

In `backend/src/main/java/com/powershare/config/SecurityConfig.java`, CORS is already configured to automatically accept all Vercel production domains:

```java
config.setAllowedOriginPatterns(Arrays.asList(
    "https://*.vercel.app",        // All Vercel deployments & preview URLs
    "http://localhost:5173",       // Local development
    "http://localhost:5174"
));
```

If you bind a custom domain to Vercel (e.g., `https://powershare.com`), add it to `allowedOriginPatterns` in `SecurityConfig.java` and push to main.

---

## 🧪 Step 5: Post-Deployment Smoke Test Checklist

Once both services are live:

1. **Open Frontend:** Visit `https://your-project.vercel.app`
2. **Health Check:** Test backend search endpoint:
   `https://powershare-backend.onrender.com/api/listings/public`
3. **Register/Login Flow:**
   - Register a new Seller account.
   - Register a new Buyer account.
4. **Seller Flow:**
   - Create a new battery listing with GPS/Address.
   - Verify listing appears on public marketplace.
5. **Buyer Flow:**
   - View listing on buyer dashboard.
   - Place an energy order.
6. **Order Confirmation:**
   - Log back in as Seller.
   - Accept & Complete the order.
   - Verify seller wallet balance updates with escrow payout.

---

## 💡 Troubleshooting Gotchas

- **Render Cold Starts (Free Tier):** On Render's free tier, backend web services go to sleep after 15 minutes of inactivity. The first API request may take 30–50 seconds to wake up the server.
- **Mixed Content Error:** Always ensure `VITE_API_BASE_URL` uses `https://` (not `http://`), otherwise browsers will block API calls from Vercel.
- **PostgreSQL SSL:** Render PostgreSQL requires SSL mode enabled in JDBC URL (`?sslmode=require`).
