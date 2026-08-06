import React, { useState, useEffect, useMemo } from "react";
import {
  Upload, Coins, Boxes, ClipboardCheck, Building2,
  Plus, Eye, Edit3, ArrowDownRight, ArrowUpRight, Clock, Trash2, Download
} from "lucide-react";
import api, { money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ProductDetailsModal from "../components/ProductDetailsModal";
import ManualStockOutModal from "../components/ManualStockOutModal";
import PurchaseInModal from "../components/PurchaseInModal";
import AddProductModal from "../components/AddProductModal";
import EditProductModal from "../components/EditProductModal";
import StockLedgerPage from "./StockLedgerPage";
import StockAudit from "./StockAudit";
import VendorMatrix from "./VendorMatrix";
import CustomSelect from "../components/ui/CustomSelect";

const CATEGORIES = ["All", "Retail", "Technical", "Equipment", "Disposal", "Others"];

export default function InventoryHub() {
  const [activeSection, setActiveSection] = useState("inventory"); // inventory | purchase_in | stock_out | vendors | stock_audit | ledger
  const [products, setProducts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all"); // all | low_stock | out_of_stock
  const [search, setSearch] = useState("");

  // Column-level filters
  const [colFilters, setColFilters] = useState({
    vendor: "",
    name: "",
    brand: "",
    category: "All",
    unit: "",
    status: "All",
  });
  const setCol = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }));

  // Modals
  const [viewProductSkuId, setViewProductSkuId] = useState(null);
  const [manualStockOutProduct, setManualStockOutProduct] = useState(null);
  const [showPurchaseInModal, setShowPurchaseInModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const handleDeleteProduct = async (skuId, name) => {
    if (!window.confirm(`Are you sure you want to delete product '${name}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/inventory/product/${skuId}`);
      toast.success(`Deleted product '${name}'`);
      fetchMasterData();
      fetchKpis();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchKpis();
  }, [statusFilter]);

  const [displayLimit, setDisplayLimit] = useState(100);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      let url = `/inventory/master?category=All`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      const res = await api.get(url);
      const prepared = (res.data || []).map((p) => ({
        ...p,
        _v: (p.vendor_name || "").toLowerCase(),
        _n: (p.name || "").toLowerCase(),
        _b: (p.brand || "").toLowerCase(),
        _u: (p.unit || "").toLowerCase(),
      }));
      setProducts(prepared);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKpis = async () => {
    try {
      const res = await api.get("/inventory/dashboard-kpis");
      setKpis(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = useMemo(() => {
    const v = (colFilters.vendor || "").trim().toLowerCase();
    const n = (colFilters.name || "").trim().toLowerCase();
    const b = (colFilters.brand || "").trim().toLowerCase();
    const u = (colFilters.unit || "").trim().toLowerCase();
    const cat = colFilters.category;
    const st = colFilters.status;

    return products.filter((p) => {
      if (v && !p._v.includes(v)) return false;
      if (n && !p._n.includes(n)) return false;
      if (b && !p._b.includes(b)) return false;
      if (cat !== "All" && p.category !== cat) return false;
      if (u && !p._u.includes(u)) return false;
      if (st !== "All") {
        const curr = p.current_stock || 0;
        const min = p.min_stock ?? 0;
        const isOut = curr === 0;
        const isLow = !isOut && min > 0 && curr <= min;
        const statusStr = isOut ? "Out of Stock" : isLow ? "Low Stock" : "Active";
        if (statusStr !== st) return false;
      }
      return true;
    });
  }, [products, colFilters]);

  const filteredMetrics = useMemo(() => {
    let totalStock = 0;
    let totalValuation = 0;
    let storeQty = 0;
    let floorQty = 0;
    let retailQty = 0;

    for (const p of filteredProducts) {
      const sQty = p.store_qty || 0;
      const fQty = p.floor_qty || 0;
      const rQty = p.retail_qty || 0;
      const curr = p.current_stock !== undefined ? p.current_stock : (sQty + fQty + rQty);
      const cost = p.unit_cost || 0;

      totalStock += curr;
      totalValuation += curr * cost;
      storeQty += sQty;
      floorQty += fQty;
      retailQty += rQty;
    }

    return {
      count: filteredProducts.length,
      totalStock,
      totalValuation,
      storeQty,
      floorQty,
      retailQty,
    };
  }, [filteredProducts]);

  const handleExportLiveInventory = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast.error("No inventory items found to export");
      return;
    }
    const headers = [
      "Vendor",
      "Product Name",
      "Brand",
      "Type",
      "Unit",
      "Current Stock",
      "Min Stock",
      "Reorder Level",
      "Cost Price (INR)",
      "MRP (INR)",
      "Selling Price (INR)",
      "Total Valuation (INR)",
      "Status"
    ];
    const rows = filteredProducts.map((p) => {
      const stock = p.total_stock !== undefined ? p.total_stock : ((p.store_qty || 0) + (p.floor_qty || 0) + (p.retail_qty || 0));
      const valuation = stock * (p.unit_cost || 0);
      return [
        `"${(p.vendor_name || p.vendor || "").replace(/"/g, '""')}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(p.brand || p.category || "").replace(/"/g, '""')}"`,
        `"${(p.ledger || p.category || "retail").replace(/"/g, '""')}"`,
        `"${(p.unit || "Piece").replace(/"/g, '""')}"`,
        stock,
        p.min_stock || 0,
        p.reorder_level || 10,
        p.unit_cost || 0,
        p.mrp || 0,
        p.selling_price || 0,
        valuation.toFixed(2),
        `"${p.status || "Active"}"`
      ].join(",");
    });

    const csvData = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Geetanjali_Live_Inventory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredProducts.length} live inventory items!`);
  };

  return (
    <div className="max-w-[96%] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Enterprise Inventory Hub Navigation Bar */}
      <div className="lss-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="lss-overline text-amber-800">Geetanjali Enterprise ERP</div>
            <h1 className="font-serif-lux text-3xl font-bold tracking-tight text-slate-950 mt-0.5">
              Inventory & Supply Chain Suite
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleExportLiveInventory}
              className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" /> Export Live Inventory
            </button>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="lss-btn-gold px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button
              onClick={() => setShowPurchaseInModal(true)}
              className="lss-btn-outline px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Purchase In
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pt-2 border-t border-slate-200">
          {[
            { id: "inventory", label: "Inventory Master", icon: Boxes },
            { id: "stock_out", label: "Stock Out Protocols", icon: Coins },
            { id: "vendors", label: "Vendor Management", icon: Building2 },
            { id: "stock_audit", label: "Stock Audit", icon: ClipboardCheck },
            { id: "ledger", label: "Stock Movement Ledger", icon: Clock },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  if (sec.id === "purchase_in") setShowPurchaseInModal(true);
                }}
                className={`relative px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-slate-950 text-amber-300 shadow-md shadow-slate-950/20"
                    : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Dashboard Summary */}
      {/* KPI Cards Dashboard Summary */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lss-card p-4">
            <span className="lss-overline block text-slate-500">Total SKUs</span>
            <span className="text-2xl font-extrabold text-slate-950 mt-1 block tabular">{kpis.total_products}</span>
          </div>
          <div className="lss-card p-4">
            <span className="lss-overline block text-slate-500">Inventory Valuation</span>
            <span className="text-2xl font-extrabold text-slate-950 mt-1 block tabular">{money(kpis.total_inventory_value)}</span>
          </div>
          <div className={`lss-card p-4 cursor-pointer transition-all ${statusFilter === "low_stock" ? "bg-amber-500 text-slate-950 border-amber-600 shadow-amber-200" : "bg-amber-50/80 border-amber-200 text-amber-950"}`} onClick={() => setStatusFilter(statusFilter === "low_stock" ? "all" : "low_stock")}>
            <span className="lss-overline block">Low Stock Alert</span>
            <span className="text-2xl font-extrabold mt-1 block tabular">{kpis.low_stock_count} items</span>
          </div>
          <div className={`lss-card p-4 cursor-pointer transition-all ${statusFilter === "out_of_stock" ? "bg-rose-600 text-white border-rose-700 shadow-rose-200" : "bg-rose-50/80 border-rose-200 text-rose-950"}`} onClick={() => setStatusFilter(statusFilter === "out_of_stock" ? "all" : "out_of_stock")}>
            <span className="lss-overline block">Out of Stock</span>
            <span className="text-2xl font-extrabold mt-1 block tabular">{kpis.out_of_stock_count} items</span>
          </div>
          <div className="lss-card p-4">
            <span className="lss-overline block text-slate-500">Today's Stock In</span>
            <span className="text-2xl font-extrabold text-emerald-800 mt-1 block tabular">+{kpis.today_stock_in}</span>
          </div>
          <div className="lss-card p-4">
            <span className="lss-overline block text-slate-500">Today's Stock Out</span>
            <span className="text-2xl font-extrabold text-rose-800 mt-1 block tabular">-{kpis.today_stock_out}</span>
          </div>
        </div>
      )}

      {/* Main Section Content Render */}
      {activeSection === "inventory" && (
        <div className="space-y-6">
          {/* Dynamic Live Filter Summary Banner */}
          <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-400/10 text-amber-400 rounded-2xl border border-amber-400/20 shadow-xs">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Live Active Filter Totals
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
                    {filteredMetrics.count} Items
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Dynamically calculated stock totals & valuation for current active list filters
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
              <div className="px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800/80 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Filtered Stock</span>
                <span className="text-xl font-black text-amber-300 tabular">{filteredMetrics.totalStock.toLocaleString()} Units</span>
              </div>

              <div className="px-4 py-2 bg-slate-900/90 rounded-xl border border-slate-800/80 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtered Valuation</span>
                <span className="text-xl font-black text-emerald-400 tabular">{money(filteredMetrics.totalValuation)}</span>
              </div>
            </div>
          </div>

          {/* Master Inventory Data Table */}
          <div className="lss-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Master Registry ({filteredProducts.length})
              </span>
              <span className="text-xs text-slate-500 font-semibold">Real-Time Inventory Status</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 bg-slate-200 rounded w-1/6"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/6"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/6"></div>
                    <div className="h-10 bg-slate-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="lss-table">
                  <thead>
                    {/* Row 1 — Column Labels */}
                    <tr className="bg-slate-950 text-amber-300">
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Vendor</th>
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Product Name</th>
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Brand</th>
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Type</th>
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Unit</th>
                      <th className="text-right py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Current Stock</th>
                      <th className="text-right py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Min Stock</th>
                      <th className="text-right py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Cost Price</th>
                      <th className="text-right py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">MRP</th>
                      <th className="text-left py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="text-center py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap">Actions</th>
                    </tr>
                    {/* Row 2 — Filter Inputs */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2">
                        <input type="text" value={colFilters.vendor} onChange={(e) => setCol("vendor", e.target.value)} placeholder="Filter vendor…" className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-slate-400 transition" />
                      </th>
                      <th className="px-3 py-2">
                        <input type="text" value={colFilters.name} onChange={(e) => setCol("name", e.target.value)} placeholder="Filter product…" className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-slate-400 transition" />
                      </th>
                      <th className="px-3 py-2">
                        <input type="text" value={colFilters.brand} onChange={(e) => setCol("brand", e.target.value)} placeholder="Filter brand…" className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-slate-400 transition" />
                      </th>
                      <th className="px-3 py-2">
                        <CustomSelect
                          options={CATEGORIES}
                          value={colFilters.category}
                          onChange={(val) => setCol("category", val)}
                          placeholder="All"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input type="text" value={colFilters.unit} onChange={(e) => setCol("unit", e.target.value)} placeholder="Filter unit…" className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-normal focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 placeholder-slate-400 transition" />
                      </th>
                      <th colSpan={4} />
                      <th className="px-3 py-2">
                        <CustomSelect
                          options={["All", "Active", "Low Stock", "Out of Stock"]}
                          value={colFilters.status}
                          onChange={(val) => setCol("status", val)}
                          placeholder="All"
                        />
                      </th>
                      <th className="px-3 py-2 text-right">
                        <button onClick={() => setColFilters({ vendor: "", name: "", brand: "", category: "All", unit: "", status: "All" })} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-rose-50">
                          Clear Filters
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dynamic Pinned Filter Totals Row */}
                    <tr className="bg-amber-50/90 border-b-2 border-amber-200/80 font-black">
                      <td colSpan={5} className="py-2.5 px-4 text-xs font-black uppercase tracking-wider text-amber-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Active Filter Totals ({filteredMetrics.count} Listed Items)</span>
                        </div>
                      </td>
                      <td className="text-right tabular font-black text-xs text-amber-950 py-2.5 px-4 bg-amber-100/70 border-x border-amber-200/60">
                        {filteredMetrics.totalStock.toLocaleString()} Units
                      </td>
                      <td className="text-right text-xs text-slate-400 py-2.5 px-4">—</td>
                      <td colSpan={2} className="text-right tabular font-black text-xs text-emerald-950 py-2.5 px-4 bg-emerald-100/60 border-x border-emerald-200/60">
                        {money(filteredMetrics.totalValuation)}
                      </td>
                      <td className="text-xs text-slate-400 py-2.5 px-4">—</td>
                      <td className="text-center py-2.5 px-4">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md shadow-2xs">
                          TOTALS
                        </span>
                      </td>
                    </tr>
                    {filteredProducts.slice(0, displayLimit).map((p) => {
                      const curr = p.current_stock || 0;
                      const min = p.min_stock ?? 0;
                      const isOut = curr === 0;
                      const isLow = !isOut && min > 0 && curr <= min;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="text-xs font-semibold text-slate-800">{p.vendor_name || "Unassigned"}</td>
                          <td>
                            <div className="font-extrabold text-slate-950 text-xs">{p.name}</div>
                          </td>
                          <td className="text-xs font-semibold text-slate-900">{p.brand || "Generic"}</td>
                          <td>
                            <span className="lss-badge text-[10px] bg-slate-100 text-slate-800">{p.category || "Retail"}</span>
                          </td>
                          <td className="text-xs font-semibold text-slate-800 capitalize">{p.unit}</td>
                          <td className={`text-right tabular font-extrabold text-sm ${isOut ? "text-rose-700 font-extrabold" : isLow ? "text-amber-700 font-extrabold" : "text-slate-950"}`}>
                            {curr}
                          </td>
                          <td className="text-right tabular font-medium text-slate-600 text-xs">{min}</td>
                          <td className="text-right tabular font-medium text-slate-800 text-xs">{money(p.unit_cost)}</td>
                          <td className="text-right tabular font-bold text-slate-950 text-xs">{money(p.mrp)}</td>
                          <td>
                            <span className={`lss-badge text-[10px] uppercase ${isOut ? "bg-rose-100 text-rose-900 border-rose-300" : isLow ? "bg-amber-100 text-amber-950 border-amber-300" : "bg-emerald-100 text-emerald-900 border-emerald-300"}`}>
                              {isOut ? "Out of Stock" : isLow ? "Low Stock" : "Active"}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewProductSkuId(p.id)}
                                className="p-1.5 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                                title="View Product Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditProduct(p)}
                                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition"
                                title="Edit Product Item"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowPurchaseInModal(true)}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Stock In"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setManualStockOutProduct(p)}
                                className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                title="Stock Out"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition"
                                title="Delete Product Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length > displayLimit && (
                      <tr>
                        <td colSpan={11} className="text-center py-4 bg-slate-50/50">
                          <button
                            onClick={() => setDisplayLimit((prev) => prev + 200)}
                            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            Show More Products (Showing {displayLimit} of {filteredProducts.length})
                          </button>
                        </td>
                      </tr>
                    )}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-12 text-slate-500 font-medium">
                          No products match the selected criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render Sub-Pages */}
      {activeSection === "stock_out" && (
        <div className="lss-card p-6 space-y-6">
          <div>
            <span className="lss-overline text-amber-800">Outward Flow Protocols</span>
            <h2 className="font-serif-lux text-2xl font-bold text-slate-950 mt-1">Stock Out Protocols</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              Option 1: Manual Stock Out (Floor Transfers & Internal Consumption) | Option 2: Automatic POS Retail & Service BOM Recipe Deductions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="lss-card p-6 bg-slate-50/60 space-y-4">
              <h3 className="font-bold text-slate-950 text-lg">Option 1 — Manual Stock Out</h3>
              <p className="text-xs text-slate-600 font-medium">
                Perform manual checkouts for floor transfers, damaged/expired stock write-offs, or demo testing with popup verification.
              </p>
              <button
                onClick={() => {
                  if (products.length > 0) setManualStockOutProduct(products[0]);
                }}
                className="lss-btn-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                Launch Manual Stock Out Popup
              </button>
            </div>

            <div className="lss-card p-6 bg-slate-50/60 space-y-4">
              <h3 className="font-bold text-slate-950 text-lg">Option 2 — POS Automatic Service BOM Deduction</h3>
              <p className="text-xs text-slate-600 font-medium">
                Automatically deduct technical ingredients (e.g. Majirel Hair Color 60g + Developer 90ml) when service bills are imported.
              </p>
              <button
                onClick={() => setActiveSection("ledger")}
                className="lss-btn-outline px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                View Automatic POS Stock Ledger Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === "vendors" && <VendorMatrix />}
      {activeSection === "stock_audit" && <StockAudit />}
      {activeSection === "ledger" && <StockLedgerPage />}

      {/* Render Product Details Modal */}
      {viewProductSkuId && (
        <ProductDetailsModal
          skuId={viewProductSkuId}
          onClose={() => setViewProductSkuId(null)}
          onStockIn={() => setShowPurchaseInModal(true)}
          onStockOut={(id) => {
            const p = products.find((x) => x.id === id);
            if (p) setManualStockOutProduct(p);
          }}
          onEdit={(id) => {
            const p = products.find((x) => x.id === id);
            if (p) setEditProduct(p);
          }}
        />
      )}

      {/* Render Edit Product Item Modal */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSuccess={() => {
            fetchMasterData();
            fetchKpis();
          }}
        />
      )}

      {/* Render Manual Stock Out Modal */}
      {manualStockOutProduct && (
        <ManualStockOutModal
          product={manualStockOutProduct}
          onClose={() => setManualStockOutProduct(null)}
          onSuccess={() => {
            fetchMasterData();
            fetchKpis();
          }}
        />
      )}

      {/* Render Purchase In Modal */}
      {showPurchaseInModal && (
        <PurchaseInModal
          onClose={() => setShowPurchaseInModal(false)}
          onSuccess={() => {
            fetchMasterData();
            fetchKpis();
          }}
        />
      )}

      {/* Render Add Product Item Modal */}
      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onSuccess={() => {
            fetchMasterData();
            fetchKpis();
          }}
        />
      )}
    </div>
  );
}
