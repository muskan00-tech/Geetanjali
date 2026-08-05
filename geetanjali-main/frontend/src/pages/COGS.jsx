import { useState, useEffect } from "react";
import { DollarSign, Plus, Trash2, Edit, Layers } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from "@/components/ui/SearchableSelect";
import api, { errMsg } from "../lib/api";

export default function COGSPage() {
  const [recipes, setRecipes] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [skus, setSkus] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState([{ sku_id: "", quantity_per_service: 1, unit: "ml" }]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRecipes(), fetchAnalysis(), fetchSkus()]).finally(() => setPageLoading(false));
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await api.get("/cogs/recipes");
      setRecipes(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const res = await api.get("/cogs/analysis");
      setAnalysis(res.data?.analysis || []);
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

  const addIngredientRow = () => {
    setIngredients([...ingredients, { sku_id: "", quantity_per_service: 1, unit: "ml" }]);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      toast.error("Please enter service name");
      return;
    }
    const validIngredients = ingredients.filter((i) => i.sku_id);
    try {
      const res = await fetch(`${BACKEND}/api/cogs/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: serviceName,
          category,
          ingredients: validIngredients,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Saved service recipe!");
        setShowModal(false);
        setServiceName("");
        setIngredients([{ sku_id: "", quantity_per_service: 1, unit: "ml" }]);
        fetchRecipes();
        fetchAnalysis();
      } else {
        toast.error("Failed to save recipe");
      }
    } catch (err) {
      toast.error("Error creating recipe");
    }
  };

  if (pageLoading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="lss-overline">COGS & Formulas</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
            <DollarSign className="w-8 h-8 text-slate-900" /> Service Recipes & COGS Analysis
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Raw material consumption formulas per service & gross margin tracking
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Create Service Recipe
        </button>
      </div>

      {/* Recipe List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((r) => (
          <div key={r.id} className="lss-card p-6 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="lss-badge bg-amber-100 text-amber-900 border border-amber-300 font-bold mb-1">{r.category || "Service"}</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{r.service_name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Material Cost</span>
                <div className="text-xl font-extrabold text-slate-900 tabular">₹{r.total_material_cost?.toLocaleString()}</div>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Ingredients Required</div>
              <div className="space-y-1.5">
                {r.ingredients?.map((ing, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>• {ing.sku_name || ing.sku_id}</span>
                    <span className="tabular font-mono text-slate-600">
                      {ing.quantity_per_service} {ing.unit} (₹{ing.cost_per_unit * ing.quantity_per_service})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gross Margin & Consumption Analysis */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" /> Material Consumption & Gross Margin Analysis
        </h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="lss-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Performed Count</th>
                <th>Total Material Cost</th>
                <th>Total Revenue</th>
                <th className="text-right">Gross Margin %</th>
              </tr>
            </thead>
            <tbody>
              {analysis.map((a, i) => (
                <tr key={i}>
                  <td className="font-bold text-slate-900">{a.service_name}</td>
                  <td className="text-slate-700 font-medium">{a.count}</td>
                  <td className="text-rose-700 font-bold tabular">₹{a.total_cost?.toLocaleString()}</td>
                  <td className="text-emerald-700 font-bold tabular">₹{a.total_revenue?.toLocaleString()}</td>
                  <td className="text-right font-extrabold text-slate-900 tabular">
                    {a.margin_pct}%
                  </td>
                </tr>
              ))}
              {analysis.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">
                    No consumption logs registered yet. Create service recipes to auto-calculate COGS on POS sales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for creating a new recipe */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-6 max-w-3xl min-h-[500px] w-full space-y-4 text-slate-900 overflow-visible">
            <h3 className="text-xl font-extrabold text-slate-900">Create New Service Recipe</h3>
            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kerastase Hair Spa"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Hair Care"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="lss-input w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Ingredients Required</label>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 mt-2">
                      <div className="flex-1 min-w-0">
                        <SearchableSelect
                          options={skus}
                          value={ing.sku_id}
                          onChange={(val) => {
                            const copy = [...ingredients];
                            copy[idx].sku_id = val;
                            setIngredients(copy);
                          }}
                          placeholder="Search SKU product name..."
                          getOptionLabel={(s) => `${s.name} (₹${s.unit_cost})`}
                          getOptionValue={(s) => s.id}
                        />
                      </div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity_per_service}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].quantity_per_service = parseFloat(e.target.value);
                        setIngredients(copy);
                      }}
                      className="lss-input w-20 text-xs font-semibold"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].unit = e.target.value;
                        setIngredients(copy);
                      }}
                      className="lss-input w-20 text-xs font-semibold"
                    >
                      <option value="ml">ml</option>
                      <option value="gm">gm</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-xs font-bold text-amber-800 mt-2.5 flex items-center gap-1 hover:underline"
                >
                  + Add Ingredient Line
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
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
