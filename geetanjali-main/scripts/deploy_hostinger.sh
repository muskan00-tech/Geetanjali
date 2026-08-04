#!/usr/bin/env bash
# ==============================================================================
# Geetanjali Salon ERP - Hostinger VPS 1-Click Production Deployment Script
# Target OS: Ubuntu 24.04 / 22.04 LTS VPS
# ==============================================================================

set -e

GREEN='\033[0;32m'
GOLD='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GOLD}======================================================${NC}"
echo -e "${GOLD}  Geetanjali Salon ERP — Hostinger VPS Deployment     ${NC}"
echo -e "${GOLD}======================================================${NC}"

# Check root privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (sudo bash deploy_hostinger.sh)${NC}"
  exit 1
fi

# Step 1: Update & Install System Prerequisites
echo -e "${CYAN}[1/5] Updating packages and installing prerequisites...${NC}"
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg ufw

# Step 2: Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo -e "${CYAN}[2/5] Installing Docker Engine & Compose...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo -e "${GREEN}[2/5] Docker is already installed.${NC}"
fi

# Step 3: Setup Application Directory & Codebase
APP_DIR="/var/www/geetanjali"
echo -e "${CYAN}[3/5] Setting up application codebase at ${APP_DIR}...${NC}"

if [ -d "$APP_DIR/.git" ]; then
  echo -e "${GREEN}Pulling latest updates from GitHub...${NC}"
  cd "$APP_DIR"
  git reset --hard
  git pull origin main
else
  mkdir -p /var/www
  git clone https://github.com/muskan00-tech/Geetanjali.git "$APP_DIR"
  cd "$APP_DIR"
fi

# Step 4: Environment Setup
if [ ! -f "$APP_DIR/.env" ]; then
  echo -e "${CYAN}[4/5] Generating production .env file...${NC}"
  cp .env.example .env
  
  # Generate random strong credentials
  PG_PASS=$(openssl rand -hex 16)
  JWT_SEC=$(openssl rand -hex 32)
  
  sed -i "s/geetanjali_secure_password_change_in_prod/${PG_PASS}/g" .env
  sed -i "s/your_super_strong_production_jwt_secret_key_change_me/${JWT_SEC}/g" .env
  sed -i "s/ENVIRONMENT=development/ENVIRONMENT=production/g" .env
  echo -e "${GREEN}Production passwords auto-generated in .env file.${NC}"
else
  echo -e "${GREEN}[4/5] Existing .env file found.${NC}"
fi

# Step 5: Build and Launch Docker Stack
echo -e "${CYAN}[5/5] Building & starting production Docker containers...${NC}"
docker compose down --remove-orphans || true
docker compose up -d --build

# Enable firewall ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable || true

echo -e "${GOLD}======================================================${NC}"
echo -e "${GREEN} SUCCESS: Geetanjali Salon ERP is deployed!${NC}"
echo -e "${GOLD}======================================================${NC}"
echo -e "${CYAN}Running Containers:${NC}"
docker compose ps
echo ""
PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo -e "${GREEN}Access the Application:${NC} http://${PUBLIC_IP}"
echo -e "${GREEN}Default Admin Credentials:${NC}"
echo -e "  Email: ${GOLD}owner@geetanjalisalon.com${NC}"
echo -e "  Password: ${GOLD}OwnerSecurePass123!${NC}"
echo -e "${GOLD}======================================================${NC}"
