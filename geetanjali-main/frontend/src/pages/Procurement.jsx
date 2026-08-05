import { useState, useEffect } from "react";
import { ShoppingCart, Plus, ArrowRight, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import SearchableSelect from "@/components/ui/SearchableSelect";
import api, { errMsg } from "../lib/api";

export default function ProcurementPage() {
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [skus, setSkus] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [lines, setLines] = useState([{ sku_id: "", quantity: 10, unit_cost: 0 }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPOs(),
      fetchVendors(),
      fetchSkus(),
      fetchReorderAlerts()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await api.get("/procurement/purchase-orders");
      setPos(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get("/vendors");
      setVendors(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSkus = async () => {
    try {
      const res = await api.get("/inventory/skus");
      setSkus(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReorderAlerts = async () => {
    try {
      const res = await api.get("/inventory/purchase-orders");
      if (res.data) {
        setReorderAlerts(res.data.filter((d) => d.needs_reorder));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }
    const validLines = lines.filter((l) => l.sku_id && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Please select at least one valid line item with quantity");
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/procurement/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vendor_id: vendorId,
          expected_delivery: expectedDelivery || null,
          lines: validLines,
        }),
      });

      if (res.ok) {
        toast.success("Purchase order generated successfully!");
        setShowModal(false);
        setVendorId("");
        setExpectedDelivery("");
        setLines([{ sku_id: "", quantity: 10, unit_cost: 0 }]);
        fetchPOs();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to generate PO");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating PO");
    }
  };

  const addLineRow = () => {
    setLines([...lines, { sku_id: "", quantity: 10, unit_cost: 0 }]);
  };

  const generatePoForAlert = (alert) => {
    setVendorId(alert.vendor_id || "");
    setLines([{ sku_id: alert.sku_id, quantity: alert.suggested_order_qty || 10, unit_cost: alert.unit_cost || 0 }]);
    setShowModal(true);
  };

  if (loading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="lss-overline">Supply Chain Operations</div>
          <h1 className="text-3xl font-extrabold text-slate-950 flex items-center gap-3 mt-1 tracking-tight">
            <ShoppingCart className="w-7 h-7 text-slate-900" /> Procurement & PO Management
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Lead time reordering, MOQ compliance, and shipment delivery tracking
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="lss-btn-gold px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {/* Lead Time & Reorder Alert Banner */}
      {reorderAlerts.length > 0 && (
        <div className="lss-card p-6 border-l-4 border-amber-500 bg-amber-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" /> Stock Replenishment & Lead Time Reorder Suggestions
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-900">
              {reorderAlerts.length} SKUs Low / Reorder Needed
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reorderAlerts.map((alert) => (
              <div
                key={alert.sku_id}
                className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block mb-1">
                    Vendor: {alert.vendor_name || "Assigned Supplier"}
                  </span>
                  <h3 className="font-extrabold text-slate-950 text-sm truncate">{alert.sku_name}</h3>
                  <div className="text-xs text-slate-600 font-semibold mt-1">
                    On Hand: <strong className="text-rose-700">{alert.on_hand}</strong> | Reorder Point: {alert.reorder_point}
                  </div>
                  <div className="text-xs text-amber-950 font-bold mt-1">
                    Suggested PO Qty: {alert.suggested_order_qty} units (₹{alert.estimated_po_cost?.toLocaleString()})
                  </div>
                </div>
                <button
                  onClick={() => generatePoForAlert(alert)}
                  className="mt-3 w-full py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  Draft PO <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PO History Table */}
      <div className="lss-card p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-slate-950">Purchase Order Registry</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="lss-table text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="py-3 px-4 text-left">PO Number</th>
                <th className="py-3 px-4 text-left">Vendor</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Delivery Date</th>
                <th className="py-3 px-4 text-center">Created At</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => {
                const totalCost = po.lines?.reduce((sum, l) => sum + (l.unit_cost * l.quantity), 0) || 0;
                return (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{po.po_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{po.vendor_name || "Vendor"}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{po.lines?.length || 0} SKUs</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-800 tabular">
                      ₹{totalCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        {po.status || "Draft"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">{po.expected_delivery || "N/A"}</td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-4xl min-h-[500px] w-full space-y-5 text-slate-900 my-auto overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xl font-extrabold text-slate-950">Generate Purchase Order</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="lss-input w-full font-semibold text-xs"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Lead Time: {v.lead_time_days} days)
                    </option>
                  ))}
                </select>
              </div>

              <DatePicker
                label="Expected Delivery Date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full mt-1"
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Line Items</label>
                  <span className="text-[11px] font-semibold text-slate-500">{lines.length} items</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {lines.map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2 w-full min-w-0 bg-slate-50/70 p-2 rounded-xl border border-slate-200/80">
                      <div className="flex-1 min-w-0">
                        <SearchableSelect
                          options={skus}
                          value={l.sku_id}
                          onChange={(val, selectedSku) => {
                            const copy = [...lines];
                            copy[idx].sku_id = val;
                            if (selectedSku) copy[idx].unit_cost = selectedSku.unit_cost || 0;
                            setLines(copy);
                          }}
                          placeholder="Type product name to search..."
                          getOptionLabel={(s) => s.name}
                          getOptionValue={(s) => s.id}
                        />
                      </div>

                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={l.quantity}
                          onChange={(e) => {
                            const copy = [...lines];
                            copy[idx].quantity = parseFloat(e.target.value) || 0;
                            setLines(copy);
                          }}
                          className="lss-input w-full text-xs font-semibold bg-white text-center"
                        />
                      </div>

                      <div className="w-28 shrink-0">
                        <input
                          type="number"
                          placeholder="Unit Cost ₹"
                          value={l.unit_cost}
                          onChange={(e) => {
                            const copy = [...lines];
                            copy[idx].unit_cost = parseFloat(e.target.value) || 0;
                            setLines(copy);
                          }}
                          className="lss-input w-full text-xs font-semibold bg-white text-right"
                        />
                      </div>

                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const copy = lines.filter((_, i) => i !== idx);
                            setLines(copy);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition shrink-0"
                          title="Remove Line Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLineRow}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 mt-3 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="lss-btn-outline px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button type="submit" className="lss-btn-gold px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider">
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
