# 🌐 Complete Hostinger Deployment Guide for Geetanjali Salon System

This guide provides step-by-step instructions for deploying the **Geetanjali Salon System** (FastAPI Backend + React Frontend) to **Hostinger**.

---

## 🎯 Recommended Architecture on Hostinger VPS (Ubuntu 22.04 / 24.04)

```
                     ┌─────────────────────────────────────────┐
                     │           Client Browser                │
                     └────────────────────┬────────────────────┘
                                          │  HTTP/HTTPS (Port 80/443)
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │              Nginx Server               │
                     │  - Serves React Frontend (static build) │
                     │  - Reverse Proxies /api -> Port 8000    │
                     └────────────────────┬────────────────────┘
                                          │  Reverse Proxy
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          FastAPI Backend (Port 8000)    │
                     │  - Gunicorn + Uvicorn Workers           │
                     │  - Managed by Systemd Service           │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │           SQLite / PostgreSQL           │
                     └─────────────────────────────────────────┘
```

---

## 📋 Prerequisites
1. Hostinger VPS (KVM Plan) or Shared Hosting with SSH access.
2. Domain / Subdomain configured in Hostinger DNS pointing to your VPS IP address.
3. Access to SSH terminal.

---

## 🚀 Step 1: Initial Server Setup (VPS)

1. **Connect to Hostinger VPS via SSH**:
   ```bash
   ssh root@<YOUR_VPS_IP_ADDRESS>
   ```

2. **Update system packages and install dependencies**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx git certbot python3-certbot-nginx
   ```

---

## 📥 Step 2: Clone Codebase to Server

1. **Create application directory & clone repository**:
   ```bash
   cd /var/www
   sudo git clone https://github.com/muskan00-tech/Geetanjali.git geetanjali
   sudo chown -R $USER:$USER /var/www/geetanjali
   cd /var/www/geetanjali
   ```

---

## ⚙️ Step 3: Setup Backend (FastAPI + Gunicorn)

1. **Create Python Virtual Environment**:
   ```bash
   cd /var/www/geetanjali/backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   pip install gunicorn uvicorn
   ```

3. **Test Backend Execution**:
   ```bash
   python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
   ```
   *(Press `Ctrl + C` after verifying startup).*

4. **Create a Systemd Service for Auto-Restart**:
   Create a systemd unit file `/etc/systemd/system/geetanjali-backend.service`:
   ```bash
   sudo nano /etc/systemd/system/geetanjali-backend.service
   ```

   Paste the following configuration:
   ```ini
   [Unit]
   Description=Geetanjali Salon FastAPI Backend Service
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/var/www/geetanjali/backend
   ExecStart=/var/www/geetanjali/backend/.venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --bind 127.0.0.1:8000
   Restart=always
   RestartSec=5
   Environment=PYTHONUNBUFFERED=1

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start and Enable Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start geetanjali-backend
   sudo systemctl enable geetanjali-backend
   sudo systemctl status geetanjali-backend
   ```

---

## 🎨 Step 4: Setup Frontend (React Production Build)

1. **Configure API Base URL**:
   In `frontend/src/lib/api.js` (or `.env`), ensure API requests use relative paths `/api` or your domain.

2. **Install Dependencies and Build Static Assets**:
   ```bash
   cd /var/www/geetanjali/frontend
   npm install
   npm run build
   ```
   *This generates optimized production files in `/var/www/geetanjali/frontend/build`.*

---

## 🌐 Step 5: Configure Nginx Web Server

1. **Create Nginx Configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/geetanjali
   ```

   Paste the following Nginx site configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com; # Replace with your domain or VPS IP

       # React Frontend Static Assets
       root /var/www/geetanjali/frontend/build;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to FastAPI Backend
       location /api/ {
           proxy_pass http://127.0.0.1:8000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 50M;
       }
   }
   ```

2. **Enable Site & Test Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/geetanjali /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 🔒 Step 6: Enable Free SSL (Let's Encrypt HTTPS)

1. **Run Certbot for SSL**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
2. **Auto-Renewal Verification**:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 🔄 Updating / Deploying Future Code Updates

When you push new changes to GitHub, run this script on Hostinger VPS:

```bash
cd /var/www/geetanjali
git pull origin main

# Rebuild Frontend
cd frontend
npm run build

# Restart Backend
sudo systemctl restart geetanjali-backend
sudo systemctl restart nginx
```

---

## ✅ Deployment Completed!
Your Geetanjali Salon system is now live, secured with HTTPS, and auto-managed on Hostinger!
