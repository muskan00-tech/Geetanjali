# 🚀 Production Deployment Guide: Supabase + Render + Firebase Hosting

This document outlines the production deployment architecture for **Geetanjali Salon ERP**.

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
 │     https://geetanjali-backend-4hxx.onrender.com            │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ Async Pooler Connection (Port 6543)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  Supabase Cloud Database                    │
 │               (Managed PostgreSQL 17)                       │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Step 1: Database on Supabase

- **Engine**: PostgreSQL 17 (Northeast Asia Tokyo `ap-northeast-1`)
- **Connection Mode**: PgBouncer Transaction Pooler (`aws-0-ap-northeast-1.pooler.supabase.com:6543`)

---

## ⚡ Step 2: Backend on Render (LIVE)

- **Live URL**: `https://geetanjali-backend-4hxx.onrender.com`
- **Swagger API Docs**: `https://geetanjali-backend-4hxx.onrender.com/docs`
- **Environment Variables**:
  - `PG_DATABASE_URL`: `postgresql+asyncpg://postgres.pohkvawdfdzmivzyoabe:12693181140%25@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
  - `ENVIRONMENT`: `production`

---

## 🌐 Step 3: Frontend Deployment to Firebase Hosting

To build and deploy the React frontend pointing to your live backend:

1. Open terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Build production static bundle:
   ```bash
   npm run build
   ```

3. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🔄 Automatic CI/CD

- **Backend (Render)**: Automatically builds & deploys when code is pushed to `main`.
- **Frontend (Firebase)**: Run `npm run build && firebase deploy --only hosting` in `frontend/`.
