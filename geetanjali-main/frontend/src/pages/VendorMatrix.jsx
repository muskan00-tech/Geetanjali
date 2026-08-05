import { useState, useEffect } from "react";
import { Building2, Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import api, { errMsg } from "../lib/api";

export default function VendorMatrixPage() {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");

  // Vendor form
  const [name, setName] = useState("");
  const [leadTime, setLeadTime] = useState(4);
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Contract form
  const [contractNumber, setContractNumber] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await api.get("/vendors/matrix");
      setMatrix(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter vendor name");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lead_time_days: parseInt(leadTime),
          contact,
          email,
          phone,
          gst_number: gstNumber,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Saved vendor profile!");
        setShowVendorModal(false);
        setName("");
        fetchMatrix();
      } else {
        toast.error("Failed to save vendor");
      }
    } catch (err) {
      toast.error("Error creating vendor");
    }
  };

  const handleDeleteVendor = async (id, vendorName) => {
    if (!window.confirm(`Delete vendor "${vendorName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BACKEND}/api/vendors/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success(`Vendor "${vendorName}" deleted`);
        fetchMatrix();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to delete vendor");
      }
    } catch (err) {
      toast.error("Error deleting vendor");
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!selectedVendorId || !endDate) {
      toast.error("Please select vendor and end date");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/api/vendors/${selectedVendorId}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_number: contractNumber,
          start_date: startDate,
          end_date: endDate,
          terms,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Contract created!");
        setShowContractModal(false);
        fetchMatrix();
      } else {
        toast.error("Failed to create contract");
      }
    } catch (err) {
      toast.error("Error creating contract");
    }
  };

  if (loading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="lss-overline">Supplier Network</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
            <Building2 className="w-8 h-8 text-slate-900" /> Vendor Performance & Contract Matrix
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Supplier lead-time tracking, contract SLAs, and fulfillment reliability scorecards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Add Vendor Profile
          </button>
        </div>
      </div>

      {/* Vendor Scorecard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {matrix.map((v) => (
          <div key={v.id} className="lss-card p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{v.name}</h3>
                <div className="text-xs text-slate-600 font-semibold mt-0.5">{v.contact || "No contact specified"}</div>
              </div>
              <span className="lss-badge bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                {v.lead_time_days} days lead
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-600 font-semibold block">Supplied SKUs</span>
                <span className="text-slate-900 font-extrabold text-base mt-0.5 block">{v.sku_count || 0} Products</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-slate-600 font-semibold block">Purchase Orders</span>
                <span className="text-slate-900 font-extrabold text-base mt-0.5 block">{v.total_pos || 0} POs</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedVendorId(v.id);
                  setShowContractModal(true);
                }}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-md border border-slate-300 transition flex items-center justify-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" /> Attach SLA Contract
              </button>
              <button
                onClick={() => handleDeleteVendor(v.id, v.name)}
                title="Delete vendor"
                className="py-2.5 px-3 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-md border border-red-200 transition flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Master Matrix Table */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Vendor Master Directory</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="lss-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Lead Time</th>
                <th>Contact</th>
                <th>Supplied SKUs</th>
                <th>Total Orders</th>
                <th className="text-right">Reliability Rating</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((v) => (
                <tr key={v.id}>
                  <td className="font-bold text-slate-900">{v.name}</td>
                  <td className="text-slate-700 font-medium">{v.lead_time_days} days</td>
                  <td className="text-slate-700 font-medium">{v.contact || "-"}</td>
                  <td className="text-slate-900 font-bold">{v.sku_count}</td>
                  <td className="text-slate-900 font-bold">{v.total_pos}</td>
                  <td className="text-right text-amber-800 font-extrabold">
                    {v.reliability_rating ? `${v.reliability_rating}/5` : "A+ Verified"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-6 max-w-md w-full space-y-4 text-slate-900">
            <h3 className="text-xl font-extrabold text-slate-900">Add New Vendor Profile</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. L'Oreal India Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Fulfillment Lead Time (Days)</label>
                <input
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button type="submit" className="lss-btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-6 max-w-md w-full space-y-4 text-slate-900">
            <h3 className="text-xl font-extrabold text-slate-900">Attach Vendor SLA Contract</h3>
            <form onSubmit={handleCreateContract} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Contract Number / Ref</label>
                <input
                  type="text"
                  placeholder="e.g. LOREAL-SLA-2026"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Terms & Penalty Clause</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g. 5% rebate if delivery exceeds lead time"
                  className="lss-input w-full h-20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button type="submit" className="lss-btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Attach Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
