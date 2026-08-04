# ✂️ Geetanjali Salon Management & Live Incentive System

A modern, full-stack salon operations management platform built for **Geetanjali Salon**. The application handles point-of-sale (POS) data ingestion, automated live staff incentive calculations, brand MRP product slabs, attendance tracking, monthly payroll payouts, inventory SKU tracking, and store manager milestone bonuses.

---

## 🚀 Features

### 💎 1. Live Incentive Calculation Engine
- **Staff Daily Bonus Tiers**: Dynamic service revenue tiers (e.g. ₹2,500–₹4,999 → ₹100 | ₹10,000–₹14,999 → ₹500 | ₹18,000+ → ₹1,000).
- **Service Revenue Formula**: Automatically calculates eligible service amounts after value card payment deductions:
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
- Supports historical filtering and quick month selection.

### 💳 4. Staff Salary & Payroll Management
- Complete staff registry with base salary management for Stylists, Beauticians, Barbers, Pedicurists, Managers, and Housekeeping.
- Excludes Store Owner (`role: owner`) from incentive calculations and payroll payouts.
- Cumulative unpaid earnings tracking and monthly payout release history.

### 📦 5. Inventory & SKU Management
- SKU master directory with opening stock, reorder levels, safety buffer percentages, purchase invoices, and vendor tracking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy (Async), SQLite / PostgreSQL, Pydantic |
| **Frontend** | React 18, Tailwind CSS, Lucide React Icons, Sonner Toasts, Axios |
| **Data Processing** | Pandas, OpenPyXL |

---

## 💻 Installation & Setup Guide

### 1. Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18.0` or higher
- **npm** or **yarn**

---

### 2. Backend Setup
1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Linux/macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will run at `http://127.0.0.1:8000`.

---

### 3. Frontend Setup
1. Open a new terminal in the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   The web application will open at `http://localhost:3000`.

---

## 📁 Directory Structure

```
geetanjali-main/
├── backend/
│   ├── core/
│   │   ├── incentive_engine.py   # Core incentive formulas & slab evaluation
│   │   ├── pg_models.py          # SQLAlchemy ORM models
│   │   └── pg_database.py        # Database session management
│   ├── geetanjali.db             # Local SQLite database
│   ├── server.py                 # FastAPI endpoints & route handlers
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components & modals
│   │   ├── pages/
│   │   │   ├── Incentives.jsx    # Live incentive calculator & tables
│   │   │   ├── Config.jsx        # Engine parameters & brand slab editor
│   │   │   ├── POSUpload.jsx     # POS CSV uploader
│   │   │   ├── Staff.jsx         # Staff directory & salary management
│   │   │   └── InventoryHub.jsx  # Inventory & SKU management
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── August product incentive.xlsx # Brand slab incentive rules reference
└── README.md
```

---

## 🔑 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/incentives/daily` | Fetch daily staff incentive calculations for a date |
| `GET` | `/api/incentives/daily/details` | Fetch itemized transaction details for a staff member |
| `GET` | `/api/incentives/monthly` | Fetch monthly efficiency multipliers & totals |
| `GET` | `/api/payouts/monthly` | Fetch total monthly payroll payout breakdown |
| `POST` | `/api/pos/upload` | Upload & ingest POS CSV sales export file |
| `GET` | `/api/config` | Retrieve master engine configuration & brand slabs |
| `PUT` | `/api/config` | Update engine tiers, brand slabs, and milestones |

---

## 📜 License

Private & Proprietary — Developed for **Geetanjali Salon**. All rights reserved.
