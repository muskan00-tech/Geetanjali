"""Complete SQLAlchemy ORM models — covers ALL existing MongoDB collections + new modules.

MongoDB embedded arrays → proper relational tables:
  skus.batches[]            → sku_batches (FK sku_id)
  pos_transactions.staff[]  → pos_transaction_staff (FK transaction_id)
  purchase_invoices.lines[] → purchase_invoice_lines (FK invoice_id)
"""
from datetime import datetime, date as date_type
from sqlalchemy import (
    String, Float, Integer, Boolean, Text, Date, DateTime,
    ForeignKey, Index, JSON, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.pg_database import Base


# ═══════════════════════════════════════════════════════════════
#  EXISTING — User
# ═══════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email", "email", unique=True),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # owner|manager|staff|admin
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self, exclude_pw=True):
        d = {"id": self.id, "email": self.email, "name": self.name, "role": self.role, "created_at": self.created_at}
        if not exclude_pw:
            d["password_hash"] = self.password_hash
        return d


# ═══════════════════════════════════════════════════════════════
#  EXISTING — Staff
# ═══════════════════════════════════════════════════════════════
class Staff(Base):
    __tablename__ = "staff"
    __table_args__ = (Index("ix_staff_name", "name", unique=True),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    base_salary: Mapped[float] = mapped_column(Float, default=25000)
    role: Mapped[str] = mapped_column(String(20), default="staff")
    department: Mapped[str] = mapped_column(String(50), default="")
    hire_date: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    shift_schedule: Mapped[dict | None] = mapped_column(JSON)
    performance_metrics: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email or "", "phone": self.phone or "",
            "base_salary": self.base_salary, "role": self.role, "department": self.department or "",
            "hire_date": self.hire_date, "is_active": self.is_active,
            "shift_schedule": self.shift_schedule, "performance_metrics": self.performance_metrics,
            "created_at": self.created_at,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — SKU + Batches (was embedded array)
# ═══════════════════════════════════════════════════════════════
class SKU(Base):
    __tablename__ = "skus"
    __table_args__ = (Index("ix_skus_name", "name", unique=True),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_code: Mapped[str] = mapped_column(String(100), default="")
    barcode: Mapped[str] = mapped_column(String(100), default="")
    name: Mapped[str] = mapped_column(String(400), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="Retail")
    ledger: Mapped[str] = mapped_column(String(20), default="retail")  # retail|technical
    vendor_id: Mapped[str | None] = mapped_column(String(64))
    vendor_name: Mapped[str] = mapped_column(String(200), default="")
    brand: Mapped[str] = mapped_column(String(200), default="")
    moq: Mapped[str] = mapped_column(String(50), default="")
    unit: Mapped[str] = mapped_column(String(50), default="Piece")
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    mrp: Mapped[float] = mapped_column(Float, default=0)
    selling_price: Mapped[float] = mapped_column(Float, default=0)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    min_stock: Mapped[float] = mapped_column(Float, default=5)
    reorder_level: Mapped[float] = mapped_column(Float, default=10)
    store_qty: Mapped[float] = mapped_column(Float, default=0)
    floor_qty: Mapped[float] = mapped_column(Float, default=0)
    retail_qty: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(50), default="Active")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[str] = mapped_column(String(50), nullable=True)

    batches: Mapped[list["SKUBatch"]] = relationship(back_populates="sku", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        total_stock = (self.store_qty or 0) + (self.floor_qty or 0) + (self.retail_qty or 0)
        return {
            "id": self.id,
            "product_code": self.product_code or f"SKU-{self.id[:6].upper()}",
            "barcode": self.barcode or f"890{self.id[:8]}",
            "name": self.name,
            "category": self.category or "Retail",
            "ledger": self.ledger or "retail",
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name or "",
            "brand": self.brand or "",
            "moq": self.moq or "",
            "unit": self.unit or "Piece",
            "unit_cost": self.unit_cost,
            "mrp": self.mrp or self.unit_price or (self.unit_cost * 1.5),
            "selling_price": self.selling_price or self.unit_price or self.unit_cost,
            "unit_price": self.unit_price or self.unit_cost,
            "current_stock": total_stock,
            "min_stock": self.min_stock,
            "reorder_level": self.reorder_level,
            "store_qty": self.store_qty,
            "floor_qty": self.floor_qty,
            "retail_qty": self.retail_qty or 0,
            "status": self.status or ("Low Stock" if total_stock <= self.min_stock else "Active"),
            "batches": [b.to_dict() for b in (self.batches or [])],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class SKUBatch(Base):
    __tablename__ = "sku_batches"
    __table_args__ = (Index("ix_batch_sku", "sku_id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sku_id: Mapped[str] = mapped_column(String(64), ForeignKey("skus.id", ondelete="CASCADE"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, default=0)
    location: Mapped[str] = mapped_column(String(20), default="store")  # store|floor|retail
    expiry_date: Mapped[str | None] = mapped_column(String(20))
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    invoice_id: Mapped[str | None] = mapped_column(String(64))
    batch_number: Mapped[str] = mapped_column(String(100), default="")
    received_at: Mapped[str] = mapped_column(String(50), nullable=True)

    sku: Mapped["SKU"] = relationship(back_populates="batches")

    def to_dict(self):
        return {
            "id": self.id, "qty": self.qty, "location": self.location,
            "expiry_date": self.expiry_date, "unit_cost": self.unit_cost,
            "invoice_id": self.invoice_id, "batch_number": self.batch_number or "",
            "received_at": self.received_at,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — POS Transaction + Staff (was embedded array)
# ═══════════════════════════════════════════════════════════════
class POSTransaction(Base):
    __tablename__ = "pos_transactions"
    __table_args__ = (Index("ix_pos_date_inv", "date", "invoice_number"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    salon: Mapped[str] = mapped_column(String(200), default="")
    invoice_number: Mapped[str] = mapped_column(String(100), default="")
    date: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD
    time: Mapped[str] = mapped_column(String(20), default="")
    client: Mapped[str] = mapped_column(String(200), default="")
    type: Mapped[str] = mapped_column(String(50), default="")  # Service|Product|Package|Gift Card|Membership
    item_name: Mapped[str] = mapped_column(String(400), default="")
    category: Mapped[str] = mapped_column(String(100), default="")
    quantity: Mapped[float] = mapped_column(Float, default=1)
    rate: Mapped[float] = mapped_column(Float, default=0)
    membership_discount: Mapped[float] = mapped_column(Float, default=0)
    manager_discount: Mapped[float] = mapped_column(Float, default=0)
    offer_discount: Mapped[float] = mapped_column(Float, default=0)
    total_discount: Mapped[float] = mapped_column(Float, default=0)
    net_price: Mapped[float] = mapped_column(Float, default=0)
    tax: Mapped[float] = mapped_column(Float, default=0)
    total_collection: Mapped[float] = mapped_column(Float, default=0)
    cash: Mapped[float] = mapped_column(Float, default=0)
    card: Mapped[float] = mapped_column(Float, default=0)
    other: Mapped[float] = mapped_column(Float, default=0)
    is_quality_failure: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    staff_shares: Mapped[list["POSTransactionStaff"]] = relationship(
        back_populates="transaction", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def eligible_service_amount(self) -> float:
        if (self.type or "").strip().lower() in ("product", "retail"):
            return float(self.net_price or 0.0)
        vc_paid = max(0.0, float(self.other or 0.0))
        eligible = float(self.net_price or 0.0) - (vc_paid * 0.50)
        return round(max(0.0, eligible), 2)

    def to_dict(self):
        return {
            "id": self.id, "salon": self.salon, "invoice_number": self.invoice_number,
            "date": self.date, "time": self.time, "client": self.client,
            "client_name": self.client,
            "type": self.type, "item_name": self.item_name, "category": self.category,
            "quantity": self.quantity, "rate": self.rate,
            "membership_discount": self.membership_discount,
            "manager_discount": self.manager_discount,
            "offer_discount": self.offer_discount,
            "total_discount": self.total_discount,
            "net_price": self.net_price,
            "value_card_paid": self.other,
            "eligible_service_amount": self.eligible_service_amount,
            "tax": self.tax,
            "total_collection": self.total_collection,
            "cash": self.cash, "card": self.card, "other": self.other,
            "staff": [s.to_dict() for s in (self.staff_shares or [])],
            "is_quality_failure": self.is_quality_failure,
            "created_at": self.created_at,
        }


class POSTransactionStaff(Base):
    __tablename__ = "pos_transaction_staff"
    __table_args__ = (Index("ix_pts_txn", "transaction_id"), Index("ix_pts_name", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("pos_transactions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    pct: Mapped[float] = mapped_column(Float, default=100)

    transaction: Mapped["POSTransaction"] = relationship(back_populates="staff_shares")

    def to_dict(self):
        return {"name": self.name, "pct": self.pct}


# ═══════════════════════════════════════════════════════════════
#  EXISTING — Payouts
# ═══════════════════════════════════════════════════════════════
class Payout(Base):
    __tablename__ = "payouts"
    __table_args__ = (
        UniqueConstraint("staff_id", "payout_date", name="uq_payout_staff_date"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    staff_id: Mapped[str] = mapped_column(String(64), nullable=False)
    payout_date: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Float, default=0)
    breakdown: Mapped[dict | None] = mapped_column(JSON)
    confirmed_by: Mapped[str] = mapped_column(String(200), default="")
    confirmed_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "staff_id": self.staff_id,
            "payout_date": self.payout_date, "amount": self.amount,
            "breakdown": self.breakdown, "confirmed_by": self.confirmed_by,
            "confirmed_at": self.confirmed_at,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — Checkouts
# ═══════════════════════════════════════════════════════════════
class Checkout(Base):
    __tablename__ = "checkouts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), default="")
    quantity: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(30), default="manual")  # manual|pos|service-use
    invoice_number: Mapped[str] = mapped_column(String(100), default="")
    checked_out_by: Mapped[str] = mapped_column(String(200), default="")
    checked_out_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "sku_id": self.sku_id, "sku_name": self.sku_name,
            "quantity": self.quantity, "notes": self.notes, "source": self.source,
            "invoice_number": self.invoice_number or "",
            "checked_out_by": self.checked_out_by, "checked_out_at": self.checked_out_at,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — Purchase Invoices + Lines (was embedded)
# ═══════════════════════════════════════════════════════════════
class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    vendor: Mapped[str] = mapped_column(String(200), default="")
    invoice_date: Mapped[str] = mapped_column(String(20), default="")
    total: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    lines: Mapped[list["PurchaseInvoiceLine"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", lazy="selectin"
    )

    def to_dict(self):
        return {
            "id": self.id, "invoice_number": self.invoice_number,
            "vendor": self.vendor, "invoice_date": self.invoice_date,
            "lines": [ln.to_dict() for ln in (self.lines or [])],
            "total": self.total, "notes": self.notes,
            "created_by": self.created_by, "created_at": self.created_at,
        }


class PurchaseInvoiceLine(Base):
    __tablename__ = "purchase_invoice_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("purchase_invoices.id", ondelete="CASCADE"), nullable=False
    )
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), default="")
    quantity: Mapped[float] = mapped_column(Float, default=0)
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    expiry_date: Mapped[str | None] = mapped_column(String(20))
    line_total: Mapped[float] = mapped_column(Float, default=0)

    invoice: Mapped["PurchaseInvoice"] = relationship(back_populates="lines")

    def to_dict(self):
        return {
            "sku_id": self.sku_id, "sku_name": self.sku_name,
            "quantity": self.quantity, "unit_cost": self.unit_cost,
            "expiry_date": self.expiry_date, "line_total": self.line_total,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — Vendors
# ═══════════════════════════════════════════════════════════════
class Vendor(Base):
    __tablename__ = "vendors"
    __table_args__ = (Index("ix_vendors_name", "name"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=4)
    contact: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    gst_number: Mapped[str] = mapped_column(String(30), default="")
    payment_terms: Mapped[dict | None] = mapped_column(JSON)
    discount_tiers: Mapped[dict | None] = mapped_column(JSON)
    reliability_rating: Mapped[float] = mapped_column(Float, default=0)
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    on_time_deliveries: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "lead_time_days": self.lead_time_days,
            "contact": self.contact or "", "email": self.email or "",
            "phone": self.phone or "", "address": self.address or "",
            "gst_number": self.gst_number or "",
            "payment_terms": self.payment_terms,
            "discount_tiers": self.discount_tiers,
            "reliability_rating": self.reliability_rating,
            "total_orders": self.total_orders,
            "on_time_deliveries": self.on_time_deliveries,
            "notes": self.notes or "", "created_at": self.created_at,
        }


# ═══════════════════════════════════════════════════════════════
#  EXISTING — App Config (flexible JSON)
# ═══════════════════════════════════════════════════════════════
class AppConfig(Base):
    __tablename__ = "app_config"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # "master"
    data: Mapped[dict | None] = mapped_column(JSON)

    def to_dict(self):
        d = dict(self.data or {})
        d["id"] = self.id
        return d


# ═══════════════════════════════════════════════════════════════
#  EXISTING — App Flags (migration markers)
# ═══════════════════════════════════════════════════════════════
class AppFlag(Base):
    __tablename__ = "app_flags"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    at: Mapped[str] = mapped_column(String(50), nullable=True)


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 3 — Attendance
# ═══════════════════════════════════════════════════════════════
class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("staff_id", "date", name="uq_attendance_staff_date"),
        Index("ix_attendance_date", "date"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    staff_id: Mapped[str] = mapped_column(String(64), nullable=False)
    staff_name: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    clock_in: Mapped[str | None] = mapped_column(String(50))
    clock_out: Mapped[str | None] = mapped_column(String(50))
    hours_worked: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(20), default="present")
    overtime_hours: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "staff_id": self.staff_id, "staff_name": self.staff_name,
            "date": self.date, "clock_in": self.clock_in, "clock_out": self.clock_out,
            "hours_worked": self.hours_worked, "status": self.status,
            "overtime_hours": self.overtime_hours, "notes": self.notes,
            "created_at": self.created_at,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 7 — Stock Audits
# ═══════════════════════════════════════════════════════════════
class StockAudit(Base):
    __tablename__ = "stock_audits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    audit_date: Mapped[str] = mapped_column(String(20), nullable=False)
    audited_by: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    total_skus_audited: Mapped[int] = mapped_column(Integer, default=0)
    total_variance_units: Mapped[float] = mapped_column(Float, default=0)
    total_variance_value: Mapped[float] = mapped_column(Float, default=0)
    discrepancy_breakdown: Mapped[dict | None] = mapped_column(JSON)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    items: Mapped[list["StockAuditItem"]] = relationship(back_populates="audit", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "audit_date": self.audit_date, "audited_by": self.audited_by,
            "status": self.status, "total_skus_audited": self.total_skus_audited,
            "total_variance_units": self.total_variance_units,
            "total_variance_value": self.total_variance_value,
            "discrepancy_breakdown": self.discrepancy_breakdown,
            "notes": self.notes, "created_at": self.created_at,
            "items": [i.to_dict() for i in (self.items or [])],
        }


class StockAuditItem(Base):
    __tablename__ = "stock_audit_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    audit_id: Mapped[str] = mapped_column(String(64), ForeignKey("stock_audits.id", ondelete="CASCADE"), nullable=False)
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), nullable=False)
    expected_qty: Mapped[float] = mapped_column(Float, default=0)
    actual_qty: Mapped[float] = mapped_column(Float, default=0)
    variance: Mapped[float] = mapped_column(Float, default=0)
    variance_pct: Mapped[float] = mapped_column(Float, default=0)
    discrepancy_reason: Mapped[str | None] = mapped_column(String(30))
    notes: Mapped[str] = mapped_column(Text, default="")

    audit: Mapped["StockAudit"] = relationship(back_populates="items")

    def to_dict(self):
        return {
            "id": self.id, "sku_id": self.sku_id, "sku_name": self.sku_name,
            "expected_qty": self.expected_qty, "actual_qty": self.actual_qty,
            "variance": self.variance, "variance_pct": self.variance_pct,
            "discrepancy_reason": self.discrepancy_reason, "notes": self.notes,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 8 — Service Recipes & COGS
# ═══════════════════════════════════════════════════════════════
class ServiceRecipe(Base):
    __tablename__ = "service_recipes"
    __table_args__ = (Index("ix_recipe_name", "service_name", unique=True),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    service_name: Mapped[str] = mapped_column(String(400), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="")
    total_material_cost: Mapped[float] = mapped_column(Float, default=0)
    avg_service_revenue: Mapped[float] = mapped_column(Float, default=0)
    margin_pct: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[str] = mapped_column(String(50), nullable=True)

    ingredients: Mapped[list["RecipeIngredient"]] = relationship(back_populates="recipe", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "service_name": self.service_name, "category": self.category,
            "total_material_cost": self.total_material_cost,
            "avg_service_revenue": self.avg_service_revenue,
            "margin_pct": self.margin_pct,
            "ingredients": [i.to_dict() for i in (self.ingredients or [])],
            "created_at": self.created_at, "updated_at": self.updated_at,
        }


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recipe_id: Mapped[str] = mapped_column(String(64), ForeignKey("service_recipes.id", ondelete="CASCADE"), nullable=False)
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), default="")
    quantity_per_service: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(10), default="ml")
    cost_per_unit: Mapped[float] = mapped_column(Float, default=0)

    recipe: Mapped["ServiceRecipe"] = relationship(back_populates="ingredients")

    def to_dict(self):
        return {
            "id": self.id, "sku_id": self.sku_id, "sku_name": self.sku_name,
            "quantity_per_service": self.quantity_per_service,
            "unit": self.unit, "cost_per_unit": self.cost_per_unit,
        }


class ServiceConsumptionLog(Base):
    __tablename__ = "service_consumption_log"
    __table_args__ = (Index("ix_consumption_date", "date"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    service_name: Mapped[str] = mapped_column(String(400), nullable=False)
    staff_id: Mapped[str | None] = mapped_column(String(64))
    staff_name: Mapped[str | None] = mapped_column(String(200))
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    ingredients_used: Mapped[dict | None] = mapped_column(JSON)
    total_cost: Mapped[float] = mapped_column(Float, default=0)
    revenue_generated: Mapped[float] = mapped_column(Float, default=0)
    pos_transaction_id: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "service_name": self.service_name,
            "staff_id": self.staff_id, "staff_name": self.staff_name,
            "date": self.date, "ingredients_used": self.ingredients_used,
            "total_cost": self.total_cost, "revenue_generated": self.revenue_generated,
            "pos_transaction_id": self.pos_transaction_id, "created_at": self.created_at,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 9 — Budgets
# ═══════════════════════════════════════════════════════════════
class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("month", "category", name="uq_budget_month_cat"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="all")
    budgeted_amount: Mapped[float] = mapped_column(Float, default=0)
    budgeted_units: Mapped[float] = mapped_column(Float, default=0)
    created_by: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    line_items: Mapped[list["BudgetLineItem"]] = relationship(back_populates="budget", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "month": self.month, "category": self.category,
            "budgeted_amount": self.budgeted_amount, "budgeted_units": self.budgeted_units,
            "created_by": self.created_by, "created_at": self.created_at,
            "line_items": [i.to_dict() for i in (self.line_items or [])],
        }


class BudgetLineItem(Base):
    __tablename__ = "budget_line_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    budget_id: Mapped[str] = mapped_column(String(64), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False)
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), default="")
    budgeted_qty: Mapped[float] = mapped_column(Float, default=0)
    budgeted_cost: Mapped[float] = mapped_column(Float, default=0)

    budget: Mapped["Budget"] = relationship(back_populates="line_items")

    def to_dict(self):
        return {
            "id": self.id, "sku_id": self.sku_id, "sku_name": self.sku_name,
            "budgeted_qty": self.budgeted_qty, "budgeted_cost": self.budgeted_cost,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 10 — Purchase Orders
# ═══════════════════════════════════════════════════════════════
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders_v2"
    __table_args__ = (Index("ix_po_number", "po_number", unique=True), Index("ix_po_status", "status"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    vendor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    vendor_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    total: Mapped[float] = mapped_column(Float, default=0)
    expected_delivery: Mapped[str | None] = mapped_column(String(20))
    actual_delivery: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    lines: Mapped[list["POLine"]] = relationship(back_populates="purchase_order", cascade="all, delete-orphan", lazy="selectin")
    status_history: Mapped[list["POStatusHistory"]] = relationship(back_populates="purchase_order", cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self):
        return {
            "id": self.id, "po_number": self.po_number,
            "vendor_id": self.vendor_id, "vendor_name": self.vendor_name,
            "status": self.status, "total": self.total,
            "expected_delivery": self.expected_delivery,
            "actual_delivery": self.actual_delivery,
            "notes": self.notes, "created_by": self.created_by,
            "created_at": self.created_at,
            "lines": [ln.to_dict() for ln in (self.lines or [])],
            "status_history": [h.to_dict() for h in (self.status_history or [])],
        }


class POLine(Base):
    __tablename__ = "po_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    po_id: Mapped[str] = mapped_column(String(64), ForeignKey("purchase_orders_v2.id", ondelete="CASCADE"), nullable=False)
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(400), default="")
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, default=0)
    moq: Mapped[float] = mapped_column(Float, default=0)
    line_total: Mapped[float] = mapped_column(Float, default=0)

    purchase_order: Mapped["PurchaseOrder"] = relationship(back_populates="lines")

    def to_dict(self):
        return {
            "id": self.id, "sku_id": self.sku_id, "sku_name": self.sku_name,
            "quantity": self.quantity, "unit_cost": self.unit_cost,
            "moq": self.moq, "line_total": self.line_total,
        }


class POStatusHistory(Base):
    __tablename__ = "po_status_history"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    po_id: Mapped[str] = mapped_column(String(64), ForeignKey("purchase_orders_v2.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[str] = mapped_column(String(200), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[str] = mapped_column(String(50), nullable=True)

    purchase_order: Mapped["PurchaseOrder"] = relationship(back_populates="status_history")

    def to_dict(self):
        return {
            "id": self.id, "status": self.status,
            "changed_by": self.changed_by, "notes": self.notes,
            "timestamp": self.timestamp,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 11 — Vendor Contracts
# ═══════════════════════════════════════════════════════════════
class VendorContract(Base):
    __tablename__ = "vendor_contracts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vendor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    contract_number: Mapped[str] = mapped_column(String(100), default="")
    start_date: Mapped[str] = mapped_column(String(20), nullable=False)
    end_date: Mapped[str] = mapped_column(String(20), nullable=False)
    terms: Mapped[str] = mapped_column(Text, default="")
    discount_structure: Mapped[dict | None] = mapped_column(JSON)
    minimum_order_frequency: Mapped[str | None] = mapped_column(String(20))
    sla_delivery_days: Mapped[int | None] = mapped_column(Integer)
    penalty_clause: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "vendor_id": self.vendor_id,
            "contract_number": self.contract_number,
            "start_date": self.start_date, "end_date": self.end_date,
            "terms": self.terms, "discount_structure": self.discount_structure,
            "minimum_order_frequency": self.minimum_order_frequency,
            "sla_delivery_days": self.sla_delivery_days,
            "penalty_clause": self.penalty_clause,
            "status": self.status, "created_at": self.created_at,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 12 — Stock Ledger
# ═══════════════════════════════════════════════════════════════
class StockLedger(Base):
    __tablename__ = "stock_ledger"
    __table_args__ = (
        Index("ix_stock_ledger_date", "date"),
        Index("ix_stock_ledger_sku", "sku_id"),
        Index("ix_stock_ledger_txn_type", "transaction_type"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    transaction_id: Mapped[str] = mapped_column(String(100), default="")
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    time: Mapped[str] = mapped_column(String(20), default="")
    sku_id: Mapped[str] = mapped_column(String(64), nullable=False)
    product_code: Mapped[str] = mapped_column(String(100), default="")
    product_name: Mapped[str] = mapped_column(String(400), default="")
    store: Mapped[str] = mapped_column(String(200), default="Main Salon Store")
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    before_stock: Mapped[float] = mapped_column(Float, default=0)
    after_stock: Mapped[float] = mapped_column(Float, default=0)
    performed_by: Mapped[str] = mapped_column(String(200), default="")
    approved_by: Mapped[str] = mapped_column(String(200), default="")
    remarks: Mapped[str] = mapped_column(Text, default="")
    timestamp: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "transaction_id": self.transaction_id,
            "date": self.date, "time": self.time,
            "sku_id": self.sku_id, "product_code": self.product_code,
            "product_name": self.product_name, "store": self.store,
            "transaction_type": self.transaction_type, "quantity": self.quantity,
            "before_stock": self.before_stock, "after_stock": self.after_stock,
            "performed_by": self.performed_by, "approved_by": self.approved_by,
            "remarks": self.remarks, "timestamp": self.timestamp,
        }


# ═══════════════════════════════════════════════════════════════
#  NEW MODULE 13 — Product Incentive Custom Mappings
# ═══════════════════════════════════════════════════════════════
class ProductIncentiveMapping(Base):
    __tablename__ = "product_incentive_mappings"
    __table_args__ = (
        Index("ix_product_inc_map_pos_name", "pos_item_name", unique=True),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    pos_item_name: Mapped[str] = mapped_column(String(400), unique=True, nullable=False)  # normalized lowercase
    display_name: Mapped[str] = mapped_column(String(400), nullable=False)
    brand: Mapped[str] = mapped_column(String(200), default="")
    pattern: Mapped[str] = mapped_column(String(200), default="")
    sku_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    min_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[str] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[str] = mapped_column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "pos_item_name": self.pos_item_name,
            "display_name": self.display_name,
            "brand": self.brand or "",
            "pattern": self.pattern or "",
            "sku_id": self.sku_id,
            "amount": self.amount,
            "min_price": self.min_price,
            "max_price": self.max_price,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


