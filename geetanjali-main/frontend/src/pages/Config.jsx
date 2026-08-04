import { useEffect, useState } from "react";
import api, { API, money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { Trash2, Plus, Edit3, Search, X, Filter, AlertCircle, Sparkles, Tag, CheckCircle2, Boxes } from "lucide-react";
import SearchableSelect from "../components/ui/SearchableSelect";

export default function Config() {
  const [cfg, setCfg] = useState(null);

  // Product Incentive Rule Edit/Add Modal State
  const [editingRuleIndex, setEditingRuleIndex] = useState(null); // -1 for add new, number for edit, null for closed
  const [ruleForm, setRuleForm] = useState({ brand: "", pattern: "", min_price: "", max_price: "", amount: "" });
  const [ruleSearch, setRuleSearch] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("All");
  const [availableSkus, setAvailableSkus] = useState([]);

  useEffect(() => {
    api.get("/config").then((r) => setCfg(r.data));
    api.get("/inventory/skus")
      .then((r) => setAvailableSkus(r.data || []))
      .catch((err) => console.error("Error fetching skus in config", err));
  }, []);

  const save = async () => {
    try {
      await api.put("/config", {
        staff_daily_tiers: cfg.staff_daily_tiers,
        staff_monthly_multipliers: cfg.staff_monthly_multipliers,
        manager_milestones: cfg.manager_milestones,
        retail_commission_pct: cfg.retail_commission_pct,
        video_review_bonus: cfg.video_review_bonus,
        inventory: cfg.inventory,
        product_incentives: cfg.product_incentives,
      });
      toast.success("Master config updated successfully");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const updateArr = (key, idx, field, value) => {
    const arr = [...cfg[key]];
    arr[idx] = { ...arr[idx], [field]: Number(value) };
    setCfg({ ...cfg, [key]: arr });
  };

  const addTier = (key, tpl) => setCfg({ ...cfg, [key]: [...cfg[key], tpl] });
  const removeTier = (key, idx) =>
    setCfg({ ...cfg, [key]: cfg[key].filter((_, i) => i !== idx) });

  const updateCardBonus = (idx, field, value) => {
    const list = [...(cfg.prepaid_card_bonuses || [])];
    list[idx] = { ...list[idx], [field]: field === "amount" ? Number(value) : value };
    setCfg({ ...cfg, prepaid_card_bonuses: list });
  };

  // Product Incentive Rule Handlers
  const handleOpenAddRule = () => {
    setRuleForm({ brand: "", pattern: "", min_price: "", max_price: "", amount: 0 });
    setEditingRuleIndex(-1);
  };

  const handleOpenEditRule = (idx, rule) => {
    setRuleForm({
      brand: rule.brand || "",
      pattern: rule.pattern || "",
      min_price: rule.min_price !== undefined && rule.min_price !== null ? rule.min_price : "",
      max_price: rule.max_price !== undefined && rule.max_price !== null ? rule.max_price : "",
      amount: rule.amount || 0,
    });
    setEditingRuleIndex(idx);
  };

  const handleDeleteRule = (idx, rule) => {
    const brandName = rule.brand ? rule.brand.toUpperCase() : "RULE";
    const patternName = rule.pattern ? `'${rule.pattern}'` : "All items";
    if (window.confirm(`Delete product incentive rule for ${brandName} (${patternName})?`)) {
      const updated = cfg.product_incentives.filter((_, i) => i !== idx);
      setCfg({ ...cfg, product_incentives: updated });
      toast.success("Rule deleted. Remember to click 'Save Master Config' to save changes.");
    }
  };

  const handleSaveRuleModal = (e) => {
    e.preventDefault();
    if (!ruleForm.brand && !ruleForm.pattern) {
      toast.error("Please provide at least a brand name or product pattern.");
      return;
    }
    const cleanRule = {
      brand: ruleForm.brand.trim().toLowerCase(),
      pattern: ruleForm.pattern.trim().toLowerCase(),
      amount: Number(ruleForm.amount) || 0,
    };
    if (ruleForm.min_price !== "" && ruleForm.min_price !== null) cleanRule.min_price = Number(ruleForm.min_price);
    if (ruleForm.max_price !== "" && ruleForm.max_price !== null) cleanRule.max_price = Number(ruleForm.max_price);

    let updatedList = [...(cfg.product_incentives || [])];
    if (editingRuleIndex === -1) {
      updatedList.push(cleanRule);
      toast.success("Rule added to matrix.");
    } else {
      updatedList[editingRuleIndex] = cleanRule;
      toast.success("Rule updated.");
    }
    setCfg({ ...cfg, product_incentives: updatedList });
    setEditingRuleIndex(null);
  };

  if (!cfg) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-32"></div>
        <div className="h-8 bg-slate-200 rounded w-64"></div>
        <div className="h-4 bg-slate-200 rounded w-96"></div>
      </div>
      <div className="h-[400px] bg-slate-200 rounded-xl w-full mt-8"></div>
      <div className="h-[300px] bg-slate-200 rounded-xl w-full mt-6"></div>
    </div>
  );

  const uniqueBrands = Array.from(new Set(availableSkus.map(s => s.brand || s.vendor_name).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(availableSkus.map(s => s.category).filter(Boolean)));
  const uniqueSkuNames = Array.from(new Set(availableSkus.map(s => s.name).filter(Boolean)));

  const filteredRules = (cfg?.product_incentives || [])
    .map((rule, origIndex) => ({ rule, origIndex }))
    .filter(({ rule }) => {
      if (selectedBrandFilter !== "All" && (rule.brand || "").toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return false;
      }
      if (ruleSearch) {
        const q = ruleSearch.toLowerCase();
        const b = (rule.brand || "").toLowerCase();
        const p = (rule.pattern || "").toLowerCase();
        if (!b.includes(q) && !p.includes(q)) return false;
      }
      return true;
    });

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="lss-overline">Master Config</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">Engine Parameters & Rules</h1>
          <p className="text-slate-600 font-medium text-sm mt-1">
            Configure incentive rules, manager milestone tiers, and inventory safety buffers.
          </p>
        </div>
        <button
          onClick={save}
          data-testid="config-save"
          className="lss-btn-gold px-8 py-3 text-xs uppercase tracking-wider font-bold shadow-sm"
        >
          Save Master Config
        </button>
      </div>

      {/* Product Incentives Formula Matrix */}
      <div className="lss-card p-6 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="lss-overline">Product Incentives Formula Matrix</div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {cfg.product_incentives?.length || 0} rules across{" "}
              {new Set((cfg.product_incentives || []).map(r => r.brand)).size} brands
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Per-brand fixed ₹ or price-slab incentive rules. Add, edit, or delete rules inline.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddRule}
              className="lss-btn-gold px-4 py-2 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Incentive Rule
            </button>
            <a
              href={`${API}/config/product-incentives.xlsx`}
              data-testid="export-product-incentives"
              className="lss-btn-outline px-4 py-2 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1.5"
            >
              Export (Excel)
            </a>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand or product pattern..."
              value={ruleSearch}
              onChange={(e) => setRuleSearch(e.target.value)}
              className="lss-input !pl-9 text-xs w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="lss-input text-xs font-semibold py-2 px-3 cursor-pointer"
            >
              <option value="All">All Brands ({cfg.product_incentives?.length || 0})</option>
              {Array.from(new Set((cfg.product_incentives || []).map((r) => r.brand || "any brand"))).sort().map((b) => (
                <option key={b} value={b}>
                  {b.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[440px] overflow-y-auto pr-1">
          {filteredRules.map(({ rule, origIndex }) => (
            <div
              key={origIndex}
              data-testid={`rule-card-${origIndex}`}
              className="p-4 bg-white border border-slate-200 hover:border-amber-300/80 rounded-xl text-xs flex flex-col justify-between transition-all shadow-xs hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-amber-900 font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80 text-[10px]">
                    {rule.brand || "any brand"}
                  </span>
                  <span className="text-emerald-700 font-extrabold text-base tabular-nums bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                    ₹{rule.amount}
                  </span>
                </div>
                <div className="text-slate-900 font-bold text-sm truncate mt-1" title={rule.pattern || "All Brand Products"}>
                  {rule.pattern ? (
                    <span className="text-slate-900 font-semibold">{rule.pattern}</span>
                  ) : (
                    <span className="text-slate-500 italic font-normal">(all brand products)</span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] font-medium mt-1">
                  Slab: {rule.min_price || rule.max_price
                    ? `₹${rule.min_price || 0}${rule.max_price ? ` – ₹${rule.max_price}` : "+"}`
                    : "Any Price"}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditRule(origIndex, rule)}
                  data-testid={`edit-rule-${origIndex}`}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  title="Edit Rule"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRule(origIndex, rule)}
                  data-testid={`delete-rule-${origIndex}`}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  title="Delete Rule"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {filteredRules.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs font-semibold">
              No product incentive rules match your filter.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="lss-card p-6">
          <div className="lss-overline">Staff Daily Tiers</div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">Service Revenue → Bonus</h3>
          {cfg.staff_daily_tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.min}
                onChange={(e) => updateArr("staff_daily_tiers", i, "min", e.target.value)}
              />
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.max}
                onChange={(e) => updateArr("staff_daily_tiers", i, "max", e.target.value)}
              />
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.bonus}
                onChange={(e) => updateArr("staff_daily_tiers", i, "bonus", e.target.value)}
              />
              <button
                onClick={() => removeTier("staff_daily_tiers", i)}
                className="lss-btn-outline flex items-center justify-center py-2 text-rose-600 hover:bg-rose-50 border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addTier("staff_daily_tiers", { min: 0, max: 0, bonus: 0 })}
            className="lss-btn-outline mt-3 px-3.5 py-1.5 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tier Row
          </button>
        </div>

        <div className="lss-card p-6">
          <div className="lss-overline">Monthly Efficiency Multipliers</div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">Ratio → % of Business</h3>
          {cfg.staff_monthly_multipliers.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.min_ratio}
                onChange={(e) =>
                  updateArr("staff_monthly_multipliers", i, "min_ratio", e.target.value)
                }
              />
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.max_ratio}
                onChange={(e) =>
                  updateArr("staff_monthly_multipliers", i, "max_ratio", e.target.value)
                }
              />
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.pct}
                onChange={(e) => updateArr("staff_monthly_multipliers", i, "pct", e.target.value)}
              />
              <button
                onClick={() => removeTier("staff_monthly_multipliers", i)}
                className="lss-btn-outline flex items-center justify-center py-2 text-rose-600 hover:bg-rose-50 border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="lss-card p-6">
          <div className="lss-overline">Manager Milestones</div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">Salon Revenue → Bonus per Manager</h3>
          {cfg.manager_milestones.map((t, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.min_revenue}
                onChange={(e) => updateArr("manager_milestones", i, "min_revenue", e.target.value)}
              />
              <input
                className="lss-input text-xs font-semibold"
                type="number"
                value={t.bonus_per_manager}
                onChange={(e) =>
                  updateArr("manager_milestones", i, "bonus_per_manager", e.target.value)
                }
              />
              <button
                onClick={() => removeTier("manager_milestones", i)}
                className="lss-btn-outline flex items-center justify-center py-2 text-rose-600 hover:bg-rose-50 border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="text-xs font-semibold text-slate-600 mt-3 pt-3 border-t border-slate-200">
            Preview:{" "}
            {cfg.manager_milestones.map((m, i) => (
              <span key={i} className="mr-3 font-bold text-slate-900">
                {money(m.min_revenue)} → {money(m.bonus_per_manager)}
              </span>
            ))}
          </div>
        </div>

        <div className="lss-card p-6">
          <div className="lss-overline">Global System Rules</div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">Retail & Inventory Defaults</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Retail Commission %</label>
              <input
                className="lss-input w-full"
                type="number"
                value={cfg.retail_commission_pct}
                onChange={(e) =>
                  setCfg({ ...cfg, retail_commission_pct: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Video Review Bonus (₹)</label>
              <input
                className="lss-input w-full"
                type="number"
                value={cfg.video_review_bonus}
                onChange={(e) => setCfg({ ...cfg, video_review_bonus: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Lead Time (Days)</label>
              <input
                className="lss-input w-full"
                type="number"
                value={cfg.inventory.lead_time_days}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    inventory: { ...cfg.inventory, lead_time_days: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Safety Buffer %</label>
              <input
                className="lss-input w-full"
                type="number"
                value={cfg.inventory.safety_buffer_pct}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    inventory: { ...cfg.inventory, safety_buffer_pct: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="lss-card p-6">
          <div className="lss-overline">Prepaid Value Card Sales</div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">Bonus Structure Breakdown</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              <div className="col-span-6">Card Sold / Name Pattern</div>
              <div className="col-span-4">Cash Bonus (₹)</div>
              <div className="col-span-2 text-center">Action</div>
            </div>
            {(cfg.prepaid_card_bonuses || []).map((t, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    className="lss-input text-xs font-semibold w-full"
                    type="text"
                    placeholder="e.g. 11,000"
                    value={t.pattern}
                    onChange={(e) => updateCardBonus(i, "pattern", e.target.value)}
                  />
                </div>
                <div className="col-span-4">
                  <input
                    className="lss-input text-xs font-semibold w-full"
                    type="number"
                    placeholder="e.g. 300"
                    value={t.amount}
                    onChange={(e) => updateCardBonus(i, "amount", e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => removeTier("prepaid_card_bonuses", i)}
                    className="lss-btn-outline p-2 text-rose-600 hover:bg-rose-50 border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                const list = cfg.prepaid_card_bonuses || [];
                setCfg({
                  ...cfg,
                  prepaid_card_bonuses: [...list, { pattern: "", amount: 0 }]
                });
              }}
              className="lss-btn-outline mt-3 px-3.5 py-1.5 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Card Row
            </button>
          </div>
        </div>
      </div>

      {/* Edit / Add Incentive Rule Modal */}
      {editingRuleIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-6 text-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="lss-overline text-amber-800">Product Incentives</span>
                <h3 className="text-xl font-bold font-serif-lux text-slate-950 mt-0.5">
                  {editingRuleIndex === -1 ? "Add Incentive Rule" : "Edit Incentive Rule"}
                </h3>
              </div>
              <button
                onClick={() => setEditingRuleIndex(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleModal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. kerastase, loreal, guinot"
                  value={ruleForm.brand}
                  onChange={(e) => setRuleForm({ ...ruleForm, brand: e.target.value })}
                  className="lss-input w-full text-xs font-semibold"
                  list="incentive-brands-datalist"
                  required
                />
                <datalist id="incentive-brands-datalist">
                  {uniqueBrands.map(b => (
                    <option key={b} value={b.toLowerCase()} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Product Pattern / Match String
                </label>
                <input
                  type="text"
                  placeholder="e.g. shampoo, masque (leave blank for all products of brand)"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  className="lss-input w-full text-xs font-semibold"
                  list="incentive-patterns-datalist"
                />
                <datalist id="incentive-patterns-datalist">
                  {uniqueCategories.concat(["shampoo", "masque", "conditioner", "serum", "oil", "cream", "spray", "treatment"]).map(pat => (
                    <option key={pat} value={pat.toLowerCase()} />
                  ))}
                </datalist>
                <p className="text-[11px] text-slate-500 mt-1">
                  Matches if product name contains this text.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Min Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={ruleForm.min_price}
                    onChange={(e) => setRuleForm({ ...ruleForm, min_price: e.target.value })}
                    className="lss-input w-full text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={ruleForm.max_price}
                    onChange={(e) => setRuleForm({ ...ruleForm, max_price: e.target.value })}
                    className="lss-input w-full text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  Incentive Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={ruleForm.amount}
                  onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                  className="lss-input w-full text-xs font-bold text-emerald-800"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                {editingRuleIndex !== null && editingRuleIndex >= 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const r = cfg.product_incentives[editingRuleIndex];
                      setEditingRuleIndex(null);
                      if (r) handleDeleteRule(editingRuleIndex, r);
                    }}
                    data-testid="modal-delete-rule"
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Rule</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRuleIndex(null)}
                    className="lss-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="lss-btn-gold px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-xs"
                  >
                    {editingRuleIndex === -1 ? "Add Rule" : "Update Rule"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
