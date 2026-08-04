# 🚀 Production Deployment Guide: Supabase + Render + Firebase Hosting

This document outlines the complete production deployment architecture for **Geetanjali Salon ERP**.

---

## 🏗️ Deployment Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                   Firebase Hosting                          │
 │             (React 19 SPA Frontend)                         │
 │     https://geetanjali-salon.web.app                        │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ API Requests (HTTPS)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   Render Web Service                        │
 │                (FastAPI Python Backend)                     │
 │     https://geetanjali-backend.onrender.com                 │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ Async Database Connection (Port 5432)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  Supabase Cloud Database                    │
 │               (Managed PostgreSQL 15/16)                    │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Step 1: Database Setup on Supabase

1. **Create a Supabase Project**:
   - Log in to [Supabase](https://supabase.com/).
   - Click **New Project** and select your region (e.g., Singapore / South Asia).
   - Set a strong database password and create the project.

2. **Retrieve Connection String**:
   - Go to **Project Settings** > **Database**.
   - Under **Connection string**, select **URI** and choose **Transaction Pooler** or **Direct Connection**.
   - Your connection string format for `asyncpg`:
     ```ini
     PG_DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
     ```

3. **Database Migrations & Initial Setup**:
   - When the backend starts up on Render for the first time, SQLAlchemy / asyncpg will automatically initialize all required tables in Supabase.

---

## ⚡ Step 2: Backend Deployment on Render

1. **Push Code to GitHub**:
   - Ensure your latest code is pushed to your GitHub repository (`main` branch).

2. **Connect Repository to Render**:
   - Log in to [Render](https://render.com/).
   - Click **New +** > **Blueprint** (or **Web Service**).
   - Connect your GitHub repository `muskan00-tech/Geetanjali`.
   - Render will detect `render.yaml` automatically.

3. **Configure Environment Variables in Render**:
   - Go to your backend service dashboard on Render > **Environment**.
   - Set the following variables:
     - `PG_DATABASE_URL`: `postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require`
     - `JWT_SECRET`: Generate a secure random secret key.
     - `CORS_ORIGINS`: `https://geetanjali-salon.web.app,https://geetanjali-salon.firebaseapp.com`
     - `ENVIRONMENT`: `production`
     - `OWNER_EMAIL`: `owner@geetanjalisalon.com`
     - `OWNER_PASSWORD`: `YourSecurePassword123!`

4. **Deploy Backend**:
   - Click **Deploy Latest Commit**.
   - Note down your Render backend URL (e.g., `https://geetanjali-backend.onrender.com`).

---

## 🌐 Step 3: Frontend Deployment on Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**:
   ```bash
   firebase login
   ```

3. **Configure Production Backend URL**:
   - In `frontend/.env.production`, set your Render backend URL:
     ```ini
     REACT_APP_BACKEND_URL=https://geetanjali-backend.onrender.com
     ```

4. **Build Frontend & Deploy**:
   ```bash
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```

5. **Verify Deployment**:
   - Access your live frontend at `https://geetanjali-salon.web.app` or your custom domain on Firebase Hosting.

---

## 🔄 CI/CD & Updating Code

1. **Backend Updates (Render)**:
   - Render automatically rebuilds and redeploys when you push to the `main` branch.

2. **Frontend Updates (Firebase)**:
   - Run `npm run build && firebase deploy --only hosting` inside the `frontend/` folder to push new frontend releases.
