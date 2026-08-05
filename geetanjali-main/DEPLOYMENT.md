# 🚀 Geetanjali Salon ERP — Production Architecture

The complete production deployment architecture for **Geetanjali Salon ERP**.

---

## 🌐 Live Application URLs

- 📱 **Frontend (Firebase Hosting)**: [https://geetanjali-707cc.web.app](https://geetanjali-707cc.web.app) *(Alternate: https://geetanjali-707cc.firebaseapp.com)*
- ⚡ **Backend API (Render)**: [https://geetanjali-backend-4hxx.onrender.com](https://geetanjali-backend-4hxx.onrender.com)
- 📚 **Interactive Swagger API Docs**: [https://geetanjali-backend-4hxx.onrender.com/docs](https://geetanjali-backend-4hxx.onrender.com/docs)
- 🗄️ **Database (Supabase PostgreSQL 17)**: `aws-0-ap-northeast-1.pooler.supabase.com:6543`

---

## 🔑 Default Production Login Credentials

### 1️⃣ Owner Account (Full Administrative Access)
- **Email**: `owner@luxurysalon.com`
- **Password**: `owner123`
- **Role**: `owner`

### 2️⃣ Manager Account (Operational Access)
- **Email**: `manager@luxurysalon.com`
- **Password**: `manager123`
- **Role**: `manager`

---

## 🏗️ Deployment Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                   Firebase Hosting                          │
 │             (React 19 SPA Frontend)                         │
 │             https://geetanjali-707cc.web.app                │
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
 └──────────────────────────────┬──────────────────────────────┘
```

---

## 🔄 How to Redeploy Future Code Updates

1. **Backend Updates (Render)**:
   - Push changes to GitHub `main` branch. Render automatically rebuilds and redeploys.

2. **Frontend Updates (Firebase Hosting)**:
   - Open terminal in `frontend/` folder:
     ```bash
     cd frontend
     npm run build
     npx firebase-tools deploy --only hosting
     ```
