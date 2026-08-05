import React, { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, FileText, ArrowDownRight, ArrowUpRight, ShieldCheck, Clock } from "lucide-react";
import api, { money } from "../lib/api";
import { motion } from "framer-motion";

export default function StockLedgerPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [txnType, setTxnType] = useState("all");

  useEffect(() => {
    fetchLedger();
  }, [txnType]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory/ledger?transaction_type=${txnType}`);
      setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.product_code?.toLowerCase().includes(search.toLowerCase()) ||
      l.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
      l.performed_by?.toLowerCase().includes(search.toLowerCase())
  );

  const getBadgeStyle = (type, qty) => {
    if (qty > 0) return "bg-emerald-100 text-emerald-900 border-emerald-300";
    if (type === "manual_stock_out") return "bg-amber-100 text-amber-950 border-amber-300";
    if (type === "pos_service_consumption") return "bg-sky-100 text-sky-950 border-sky-300";
    return "bg-slate-100 text-slate-900 border-slate-300";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <span className="lss-overline text-amber-800">Audit Trail & Compliance</span>
          <h1 className="font-serif-lux text-3xl font-bold tracking-tight text-slate-950 mt-1">
            Real-Time Stock Movement Ledger
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-1">
            Immutable transaction record for every stock in, manual checkout, POS sale, and service BOM consumption.
          </p>
        </div>
        <button
          onClick={fetchLedger}
          className="lss-btn-outline px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Ledger
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Product Name, Transaction ID, or Staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lss-input !pl-10 w-full text-xs font-semibold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Type Filter:</span>
          <select
            value={txnType}
            onChange={(e) => setTxnType(e.target.value)}
            className="lss-input text-xs font-bold"
          >
            <option value="all">All Movements</option>
            <option value="purchase_order">Purchase Order Inward</option>
            <option value="direct_purchase">Direct Purchase</option>
            <option value="manual_stock_out">Manual Stock Out</option>
            <option value="pos_retail_sale">POS Retail Sale</option>
            <option value="pos_service_consumption">POS Service BOM</option>
            <option value="audit_adjustment">Stock Audit Adjustment</option>
          </select>
        </div>
      </div>

      {/* Ledger Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Stock Ledger Entries ({filteredLogs.length})
          </span>
          <span className="text-xs text-slate-500 font-semibold">Strict Real-time Audit Trail</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-10 bg-slate-200 rounded w-1/5"></div>
                <div className="h-10 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200 rounded w-1/5"></div>
                <div className="h-10 bg-slate-200 rounded w-1/5"></div>
                <div className="h-10 bg-slate-200 rounded w-1/5"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="lss-table">
              <thead>
                <tr>
                  <th>Txn ID & Date</th>
                  <th>Product</th>
                  <th>Store / Location</th>
                  <th>Transaction Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Before → After</th>
                  <th>Performed By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="font-mono font-bold text-slate-950 text-xs">{l.transaction_id || `TXN-${l.id ? l.id.slice(0, 8) : ""}`}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{l.date} at {l.time}</div>
                    </td>
                    <td>
                      <div className="font-extrabold text-slate-950 text-xs">{l.product_name}</div>
                    </td>
                    <td className="text-xs font-semibold text-slate-700">{l.store || "Main Salon Store"}</td>
                    <td>
                      <span className={`lss-badge text-[10px] uppercase ${getBadgeStyle(l.transaction_type, l.quantity)}`}>
                        {l.transaction_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className={`text-right tabular font-extrabold text-xs ${l.quantity > 0 ? "text-emerald-800" : "text-rose-800"}`}>
                      {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                    </td>
                    <td className="text-right tabular font-semibold text-slate-800 text-xs">
                      {l.before_stock} → <strong className="text-slate-950 font-bold">{l.after_stock}</strong>
                    </td>
                    <td>
                      <div className="text-xs font-bold text-slate-950">{l.performed_by || "System"}</div>
                      {l.approved_by && <div className="text-[10px] text-slate-500">Appr: {l.approved_by}</div>}
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate" title={l.remarks}>
                      {l.remarks || "Standard Movement"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                      No stock movement entries match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
