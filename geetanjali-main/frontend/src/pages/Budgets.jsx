import { useState, useEffect } from "react";
import { Calculator, Plus } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DatePicker from "@/components/ui/DatePicker";
import api, { errMsg } from "../lib/api";

export default function BudgetsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [variance, setVariance] = useState([]);
  const [skus, setSkus] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [budgetedAmount, setBudgetedAmount] = useState(50000);
  const [category, setCategory] = useState("all");
  const [lineItems, setLineItems] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    setPageLoading(true);
    Promise.all([fetchBudgets(), fetchVariance(), fetchSkus()]).finally(() => setPageLoading(false));
  }, [month]);

  const fetchBudgets = async () => {
    try {
      const res = await api.get(`/budgets?month=${month}`);
      setBudgets(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVariance = async () => {
    try {
      const res = await api.get(`/budgets/variance?month=${month}`);
      setVariance(res.data?.variance || []);
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

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/api/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          category,
          budgeted_amount: parseFloat(budgetedAmount),
          line_items: lineItems,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Budget created for " + month);
        setShowModal(false);
        fetchBudgets();
        fetchVariance();
      } else {
        toast.error("Failed to create budget");
      }
    } catch (err) {
      toast.error("Error creating budget");
    }
  };

  const addLineItemRow = () => {
    setLineItems([...lineItems, { sku_id: "", budgeted_qty: 10, budgeted_cost: 5000 }]);
  };

  if (pageLoading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="lss-overline">Capital Planning</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
            <Calculator className="w-8 h-8 text-slate-900" /> Inventory Budget vs Actual Analysis
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Monthly stock allocation budgets, consumption tracking, and spending variances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Set Monthly Budget
          </button>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {budgets.map((b) => (
          <div key={b.id} className="lss-card p-6 space-y-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Budget ({b.month})</span>
            <div className="text-3xl font-extrabold text-slate-900 tabular">₹{b.budgeted_amount?.toLocaleString()}</div>
            <div className="text-xs font-semibold text-amber-800">Category: {b.category}</div>
          </div>
        ))}
        {budgets.length === 0 && (
          <div className="col-span-full lss-card p-8 text-center text-slate-600 font-medium">
            No inventory budget set for {month}. Click "Set Monthly Budget" to allocate capital.
          </div>
        )}
      </div>

      {/* Variance Table */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Budget vs Actual Variance Report</h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="lss-table">
            <thead>
              <tr>
                <th>SKU Product</th>
                <th>Budgeted Qty</th>
                <th>Actual Qty Consumed</th>
                <th>Budgeted Cost</th>
                <th>Actual Cost</th>
                <th className="text-right">Cost Variance</th>
              </tr>
            </thead>
            <tbody>
              {variance.map((v, i) => (
                <tr key={i}>
                  <td className="font-bold text-slate-900">{v.sku_name}</td>
                  <td className="text-slate-900 font-bold tabular">{v.budgeted_qty}</td>
                  <td className="text-amber-800 font-bold tabular">{v.actual_qty}</td>
                  <td className="text-slate-700 font-medium tabular">₹{v.budgeted_cost?.toLocaleString()}</td>
                  <td className="text-slate-900 font-bold tabular">₹{v.actual_cost?.toLocaleString()}</td>
                  <td
                    className={`text-right tabular font-bold ${
                      v.variance_cost > 0 ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {v.variance_cost > 0 ? `+₹${v.variance_cost}` : `₹${v.variance_cost}`}
                  </td>
                </tr>
              ))}
              {variance.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">
                    No variance data available for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-6 max-w-3xl min-h-[500px] w-full space-y-4 text-slate-900 overflow-visible">
            <h3 className="text-xl font-extrabold text-slate-900">Set Budget for {month}</h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Total Budget Allocation (₹)</label>
                <input
                  type="number"
                  value={budgetedAmount}
                  onChange={(e) => setBudgetedAmount(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">SKU Specific Line Items</label>
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mt-2">
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        options={skus}
                        value={item.sku_id}
                        onChange={(val) => {
                          const copy = [...lineItems];
                          copy[idx].sku_id = val;
                          setLineItems(copy);
                        }}
                        placeholder="Search product SKU name..."
                        getOptionLabel={(s) => s.name}
                        getOptionValue={(s) => s.id}
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="Budget Qty"
                      value={item.budgeted_qty}
                      onChange={(e) => {
                        const copy = [...lineItems];
                        copy[idx].budgeted_qty = parseFloat(e.target.value);
                        setLineItems(copy);
                      }}
                      className="lss-input w-24 text-xs font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Budget Cost ₹"
                      value={item.budgeted_cost}
                      onChange={(e) => {
                        const copy = [...lineItems];
                        copy[idx].budgeted_cost = parseFloat(e.target.value);
                        setLineItems(copy);
                      }}
                      className="lss-input w-28 text-xs font-semibold"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLineItemRow}
                  className="text-xs font-bold text-amber-800 mt-2.5 flex items-center gap-1 hover:underline"
                >
                  + Add SKU Budget Line Item
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button type="submit" className="lss-btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
