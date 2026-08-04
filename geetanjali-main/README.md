# ✂️ Geetanjali Salon ERP — Enterprise PostgreSQL Edition

A high-performance, enterprise-grade salon operations and live incentive platform built for **Geetanjali Salon**. The application is powered exclusively by **PostgreSQL**, **FastAPI**, **React 19**, **Gunicorn/Uvicorn**, and **Nginx**.

---

## 🚀 Key Enterprise Features

### 💎 1. Live Incentive Engine
- **Staff Daily Bonus Tiers**: Dynamic service revenue tiers (e.g. ₹2,500–₹4,999 → ₹100 | ₹10,000–₹14,999 → ₹500 | ₹18,000+ → ₹1,000).
- **Service Revenue Formula**: Calculates eligible service amounts after value card payment deductions:
  $$\text{Eligible Service Amount} = \max(0, \text{Net Price} - (\text{Paid from Value Card} \times 0.50))$$
- **Multi-Staff Splits**: Computes fractional service revenue contributions based on percentage splits recorded in POS invoices.
- **Monthly Efficiency Multipliers**: Calculates staff revenue-to-base-salary ratios (e.g. 4x–5x → 3%, 5x–6x → 5%, 6x+ → 6%).
- **Manager Milestones**: Automated monthly store milestone bonuses awarded to active store managers based on total salon revenue thresholds.

### 🧴 2. August 2026 Brand MRP Product Incentive Slabs
Supports brand-wise unit MRP incentive slabs evaluated automatically on POS retail product sales:
- **L'Oréal Professionnel**: ₹1–2,000 → ₹50 | ₹2,001–4,000 → ₹100 | ₹4,001+ → ₹150
- **Kanpeki**: ₹1–3,000 → ₹50 | ₹3,001+ → ₹100
- **Kérastase**: ₹1–3,000 → ₹50 | ₹3,001–6,000 → ₹100 | ₹6,001–9,000 → ₹150 | ₹9,001–12,000 → ₹200 | ₹12,001+ → ₹250
- **Olaplex**: ₹1–3,000 → ₹50 | ₹3,001–5,000 → ₹100 | ₹5,001+ → ₹150
- **Kerafusion / De Fabulous**: ₹1–2,000 → ₹50 | ₹2,001–4,000 → ₹100 | ₹4,001+ → ₹150
- **Amazon Series**: All Products → ₹100
- **QOD**: All Products → ₹100

### 📊 3. POS Data Import & Sync
- Flexible CSV scanner handling non-standard column headers (`Staff 1`, `Staff 1 -%`, `Paid from Value Card`, `Net Price`, etc.).
- Invoice-level reset sync to import 100% of line items without duplicate drops.

### 💳 4. Staff Salary & Payroll Management
- Complete staff registry with base salary management for Stylists, Beauticians, Barbers, Pedicurists, Managers, and Housekeeping.
- Excludes Store Owner (`role: owner`) from incentive calculations and payroll payouts.

---

## 🛠️ Production Tech Stack

| Component | Technology |
| :--- | :--- |
| **Database** | PostgreSQL 16 (100% Native Async via SQLAlchemy & `asyncpg`) |
| **Backend** | Python 3.11+, FastAPI, Gunicorn, Uvicorn, Pydantic v2 |
| **Frontend** | React 19, Tailwind CSS, Lucide Icons |
| **Reverse Proxy** | Nginx 1.25 Alpine |
| **Orchestration** | Docker & Docker Compose |

---

## 🐳 Docker Production Quickstart

1. **Clone & Configure Environment**:
   ```bash
   git clone https://github.com/muskan00-tech/Geetanjali.git
   cd Geetanjali
   cp .env.example .env
   ```

2. **Start All Containers**:
   ```bash
   docker compose up -d --build
   ```

3. **Access Application**:
   - Web Frontend: `http://localhost`
   - FastAPI Backend API Docs: `http://localhost/api/docs`

---

## 📜 Documentation

- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Ubuntu 24.04 VPS deployment & backup procedures.
