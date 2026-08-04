# 🚀 Enterprise Production Deployment Guide for Ubuntu 24.04 VPS

This document outlines the complete production deployment architecture for the **Geetanjali Salon ERP** running 100% on **PostgreSQL**, **Docker**, **FastAPI**, **React 19**, and **Nginx**.

---

## 🏗️ Architecture Overview

```
                      Internet / Users
                             │
                             ▼ (Ports 80 / 443)
              ┌──────────────────────────────┐
              │    Nginx (Reverse Proxy)     │
              └──────────────┬───────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│   React 19 Frontend   │         │    FastAPI Backend    │
│   Static Nginx Assets │         │  Gunicorn + Uvicorn   │
└───────────────────────┘         └───────────┬───────────┘
                                              │
                                              ▼ (Port 5432)
                                  ┌───────────────────────┐
                                  │ PostgreSQL 16 Alpine  │
                                  │ Persistent DB Volume  │
                                  └───────────────────────┘
```

---

## 📋 Step 1: Initial Ubuntu 24.04 VPS Preparation

Connect to your Ubuntu VPS via SSH:
```bash
ssh root@<YOUR_VPS_IP>
```

Update system packages and install Docker & Docker Compose:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

---

## 📥 Step 2: Clone Repository & Configure Environment

Clone the repository to `/var/www/geetanjali`:
```bash
cd /var/www
git clone https://github.com/muskan00-tech/Geetanjali.git geetanjali
cd /var/www/geetanjali
```

Copy the environment template and set production secrets:
```bash
cp .env.example .env
nano .env
```

Ensure `PG_DATABASE_URL` is set to the internal Docker PostgreSQL service:
```ini
PG_DATABASE_URL=postgresql+asyncpg://geetanjali_user:SecurePassword123!@postgres:5432/geetanjali_db
JWT_SECRET=your_super_strong_production_jwt_secret_key_here
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com
```

---

## 🐳 Step 3: Launch Production Docker Stack

Build and start all production containers (PostgreSQL, FastAPI Backend, React Frontend, Nginx):
```bash
docker compose up -d --build
```

Verify that all containers are healthy:
```bash
docker compose ps
```

Check backend startup logs:
```bash
docker compose logs -f backend
```

---

## 🔒 Step 4: SSL Certificate Setup (Let's Encrypt HTTPS)

To attach a domain name and enable HTTPS via Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 💾 Step 5: Setup Automatic PostgreSQL Backups (Cron Job)

Make the backup script executable:
```bash
chmod +x scripts/backup_postgres.sh
```

Add a daily cron job running at 2:00 AM:
```bash
crontab -e
```

Add the following line:
```cron
0 2 * * * /bin/bash /var/www/geetanjali/scripts/backup_postgres.sh >> /var/log/geetanjali_backup.log 2>&1
```

---

## 🔄 Updating / Deploying Code Updates

To pull and deploy future code updates with zero downtime:
```bash
cd /var/www/geetanjali
git pull origin main
docker compose up -d --build
```

---

## ⏪ Rollback Procedure

If a deployment needs to be rolled back to a previous commit:
```bash
git log -n 5 --oneline
git checkout <PREVIOUS_COMMIT_HASH>
docker compose up -d --build
```
