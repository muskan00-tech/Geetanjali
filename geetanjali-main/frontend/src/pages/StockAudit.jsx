import { useState, useEffect } from "react";
import { ClipboardCheck, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api, { errMsg } from "../lib/api";

export default function StockAuditPage() {
  const [history, setHistory] = useState([]);
  const [skus, setSkus] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [actualCounts, setActualCounts] = useState({});
  const [discrepancies, setDiscrepancies] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchSkus();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/audit/history");
      setHistory(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSkus = async () => {
    try {
      const res = await api.get("/inventory/skus");
      const data = res.data || [];
      setSkus(data);
      const initialCounts = {};
      data.forEach((s) => {
        initialCounts[s.id] = (s.store_qty || 0) + (s.floor_qty || 0) + (s.retail_qty || 0);
      });
      setActualCounts(initialCounts);
    } catch (e) {
      console.error(e);
    }
  };

  const startAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/audit/start`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setActiveAudit(data);
        toast.success(`Started audit session: ${data.audit_id.slice(0, 8)}`);
      } else {
        toast.error("Failed to start audit");
      }
    } catch (e) {
      toast.error("Error starting audit");
    } finally {
      setLoading(false);
    }
  };

  const submitAuditItems = async () => {
    if (!activeAudit) return;
    setLoading(true);
    const items = skus.map((s) => ({
      sku_id: s.id,
      actual_qty: parseFloat(actualCounts[s.id] || 0),
      discrepancy_reason: discrepancies[s.id] || null,
    }));
    try {
      const res = await fetch(`${BACKEND}/api/audit/${activeAudit.audit_id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Submitted physical counts & calculated variances");
        await fetch(`${BACKEND}/api/audit/${activeAudit.audit_id}/complete`, {
          method: "POST",
          credentials: "include",
        });
        setActiveAudit(null);
        fetchHistory();
        fetchSkus();
      } else {
        toast.error("Submission failed");
      }
    } catch (e) {
      toast.error("Error submitting audit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="lss-overline">Physical Audit</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
            <ClipboardCheck className="w-8 h-8 text-slate-900" /> Stock Audit & Reconciliation
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Physical count verification, digital variance calculations, and stock leakage tracking
          </p>
        </div>
        {!activeAudit ? (
          <button
            onClick={startAudit}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm text-sm"
          >
            <Play className="w-4 h-4 fill-current" /> Start New Audit Session
          </button>
        ) : (
          <button
            onClick={submitAuditItems}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-emerald-800 transition shadow-sm text-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Save & Finalize Reconciliation
          </button>
        )}
      </div>

      {/* Active Audit Form */}
      {activeAudit && (
        <div className="lss-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <span className="lss-badge bg-amber-100 text-amber-900 border border-amber-300 font-bold">Active Session</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">Physical Count Input Form</h2>
            </div>
            <div className="text-xs font-semibold text-slate-600">Session ID: {activeAudit.audit_id}</div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="lss-table">
              <thead>
                <tr>
                  <th>SKU Name</th>
                  <th>Category</th>
                  <th>System Expected</th>
                  <th>Actual Count</th>
                  <th>Variance</th>
                  <th>Reason (If Discrepancy)</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((s) => {
                  const expected = (s.store_qty || 0) + (s.floor_qty || 0) + (s.retail_qty || 0);
                  const actual = parseFloat(actualCounts[s.id] ?? expected);
                  const variance = actual - expected;
                  return (
                    <tr key={s.id}>
                      <td className="font-bold text-slate-900">{s.name}</td>
                      <td className="text-slate-600 font-medium">{s.category}</td>
                      <td className="text-slate-900 font-bold tabular">{expected}</td>
                      <td>
                        <input
                          type="number"
                          value={actualCounts[s.id] ?? expected}
                          onChange={(e) =>
                            setActualCounts({ ...actualCounts, [s.id]: e.target.value })
                          }
                          className="w-24 lss-input py-1 px-2 text-sm font-bold tabular"
                        />
                      </td>
                      <td className={`tabular font-bold ${variance < 0 ? "text-rose-700" : variance > 0 ? "text-emerald-700" : "text-slate-500"}`}>
                        {variance > 0 ? `+${variance}` : variance}
                      </td>
                      <td>
                        <select
                          value={discrepancies[s.id] || ""}
                          onChange={(e) => setDiscrepancies({ ...discrepancies, [s.id]: e.target.value })}
                          className="lss-input py-1 px-2 text-xs font-semibold"
                        >
                          <option value="">Select Reason...</option>
                          <option value="spill">Spill / Damage</option>
                          <option value="waste">Expired Waste</option>
                          <option value="theft">Unaccounted / Theft</option>
                          <option value="unrecorded_usage">Unrecorded Service Use</option>
                          <option value="count_error">Initial Count Error</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit History Log */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Completed Audit History</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="lss-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Audited By</th>
                <th>Status</th>
                <th>SKUs Audited</th>
                <th>Total Unit Variance</th>
                <th className="text-right">Value Impact</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="font-bold text-slate-900">{h.audit_date}</td>
                  <td className="text-slate-700 font-medium">{h.audited_by}</td>
                  <td>
                    <span className="lss-badge bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold capitalize">
                      {h.status}
                    </span>
                  </td>
                  <td className="text-slate-900 font-bold">{h.total_skus_audited}</td>
                  <td className={`tabular font-bold ${h.total_variance_units < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {h.total_variance_units}
                  </td>
                  <td className="text-right tabular font-extrabold text-slate-900">
                    ₹{h.total_variance_value?.toLocaleString()}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">
                    No past stock audits logged. Click "Start New Audit Session" to initiate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
