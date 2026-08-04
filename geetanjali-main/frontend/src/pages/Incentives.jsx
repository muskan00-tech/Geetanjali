import { useEffect, useState } from "react";
import api, { API, money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, Sparkles, Eye, X } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

function CumulativeReport({ onViewDetails }) {
  const [from, setFrom] = useState("2026-06-26");
  const [to, setTo] = useState("2026-06-28");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/cumulative-payouts?date_from=${from}&date_to=${to}`)
      .then(r => setData(r.data))
      .catch(e => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <DatePicker label="From" value={from} onChange={e => setFrom(e.target.value)} testId="cum-from" />
        <DatePicker label="To" value={to} onChange={e => setTo(e.target.value)} testId="cum-to" />
        <a href={`${API}/reports/cumulative-payouts.xlsx?date_from=${from}&date_to=${to}`}
           data-testid="cum-export" className="lss-btn-gold px-4 py-2 text-xs uppercase tracking-wider font-bold ml-auto self-end">
          Export Excel
        </a>
      </div>

      {loading ? (
        <div className="p-4 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-200 rounded w-full"></div>)}
        </div>
      ) : data && (
        <div className="lss-card overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="lss-table" data-testid="cumulative-table">
            <thead><tr>
              <th>Staff</th><th className="text-right">Unpaid Days</th>
              <th className="text-right">Cum Service ₹</th><th className="text-right">Cum Bonus ₹</th>
              <th className="text-right">Cum Product Inc ₹</th><th className="text-right">Total Due ₹</th>
            </tr></thead>
            <tbody>
              {data.rows.sort((a,b)=>b.cumulative_total_due-a.cumulative_total_due).map(r => (
                <tr key={r.staff_id}>
                  <td className="font-extrabold text-slate-950">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetails(r.staff_name, r.unpaid_days)}
                        className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <span>{r.staff_name}</span>
                    </div>
                  </td>
                  <td className="text-right tabular font-semibold text-slate-700">{r.unpaid_days_count}</td>
                  <td className="text-right tabular font-semibold text-slate-700">{money(r.cumulative_service)}</td>
                  <td className="text-right tabular font-extrabold text-amber-800">{money(r.cumulative_bonus)}</td>
                  <td className="text-right tabular font-extrabold text-emerald-800">{money(r.cumulative_product_incentive)}</td>
                  <td className="text-right tabular font-extrabold text-slate-950 bg-slate-50/50">{money(r.cumulative_total_due)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 font-medium py-8">All caught up — no unpaid incentives.</td></tr>}
            </tbody>
            {data.rows.length > 0 && (
              <tfoot className="bg-slate-100/80 font-extrabold border-t-2 border-slate-300">
                <tr>
                  <td className="py-3.5 px-4 text-slate-950">TOTAL</td>
                  <td className="text-right tabular py-3.5 px-4 text-slate-800">{data.rows.reduce((s, r) => s + (r.unpaid_days_count || 0), 0)}</td>
                  <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(data.rows.reduce((s, r) => s + (r.cumulative_service || 0), 0))}</td>
                  <td className="text-right tabular py-3.5 px-4 text-amber-900">{money(data.rows.reduce((s, r) => s + (r.cumulative_bonus || 0), 0))}</td>
                  <td className="text-right tabular py-3.5 px-4 text-emerald-900">{money(data.rows.reduce((s, r) => s + (r.cumulative_product_incentive || 0), 0))}</td>
                  <td className="text-right tabular py-3.5 px-4 text-slate-950 bg-amber-500/10">{money(data.rows.reduce((s, r) => s + (r.cumulative_total_due || 0), 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </motion.div>
  );
}

export default function Incentives() {
  const [tab, setTab] = useState("daily");
  const [dates, setDates] = useState([]);
  const [day, setDay] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [manager, setManager] = useState(null);
  const [unmappedCount, setUnmappedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState(""); // "daily" | "monthly" | "cumulative"
  const [detailStaffName, setDetailStaffName] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cumulativeUnpaidDays, setCumulativeUnpaidDays] = useState([]);

  const loadDetailData = (staffName, type, dateVal) => {
    setDetailStaffName(staffName);
    setDetailType(type);
    setDetailDate(dateVal);
    setDetailOpen(true);
    
    if (type === "cumulative") {
      return;
    }
    
    setDetailLoading(true);
    setDetailData(null);
    
    const url = type === "daily" 
      ? `/incentives/daily/details?staff_name=${encodeURIComponent(staffName)}&day=${dateVal}`
      : `/incentives/monthly/details?staff_name=${encodeURIComponent(staffName)}&month=${dateVal}`;
      
    api.get(url)
      .then(r => setDetailData(r.data))
      .catch(e => toast.error(errMsg(e)))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    api.get("/pos/dates").then((r) => {
      setDates(r.data);
      if (r.data[0]) {
        setDay(r.data[0]);
        setMonth(r.data[0].slice(0, 7));
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let p = Promise.resolve();
    if (tab === "daily" && day) {
      p = api.get(`/incentives/daily?day=${day}`).then((r) => setDaily(r.data)).catch((e) => toast.error(errMsg(e)));
    }
    else if (tab === "monthly" && month) {
      p = api.get(`/incentives/monthly?month=${month}`).then((r) => setMonthly(r.data)).catch((e) => toast.error(errMsg(e)));
    }
    else if (tab === "manager" && month) {
      p = api.get(`/incentives/manager?month=${month}`).then((r) => setManager(r.data)).catch((e) => toast.error(errMsg(e)));
    }
    p.finally(() => setLoading(false));
  }, [tab, day, month]);

  const tabs = [
    { key: "daily", label: "Staff Daily" },
    { key: "monthly", label: "Staff Monthly" },
    { key: "manager", label: "Manager Milestones" },
    { key: "cumulative", label: "Cumulative Unpaid" },
  ];

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="lss-overline">Incentive Engine</div>
        <h1 className="font-serif-lux text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight mt-1">Live Incentive Calculator</h1>
      </div>

      {/* Animated Sliding Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto relative">
        {tabs.map((t) => (
          <button
            key={t.key}
            data-testid={`tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-colors ${
              tab === t.key ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            {tab === t.key && (
              <motion.div
                layoutId="incentiveTabIndicator"
                className="absolute inset-0 bg-amber-100/80 border border-amber-300/80 rounded-lg shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "daily" && (
          <motion.div key="daily" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex items-center gap-4 mb-6">
              <DatePicker
                label="Business Date"
                testId="daily-date"
                value={day || new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="p-4 space-y-4 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>)}
                </div>
                <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ) : daily && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                  {daily.config.map((t) => (
                    <motion.div key={t.min} whileHover={{ scale: 1.03 }} className="lss-card p-4">
                      <div className="lss-overline">
                        {money(t.min)}
                        {t.max < 99999999 ? `–${money(t.max)}` : "+"}
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold mt-1 text-slate-950 tabular">
                        {money(t.bonus)}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="lss-card overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                  <table className="lss-table" data-testid="daily-table">
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th className="text-right">Service ₹</th>
                        <th className="text-right">Retail ₹</th>
                        <th>Tier Hit</th>
                        <th className="text-right">Daily Bonus</th>
                        <th className="text-right">Retail Comm (3%)</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.rows.map((r) => (
                        <tr key={r.staff_id}>
                          <td className="font-extrabold text-slate-950">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => loadDetailData(r.staff_name, "daily", day || new Date().toISOString().slice(0, 10))}
                                className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <span>{r.staff_name}</span>
                            </div>
                          </td>
                          <td className="text-right tabular font-semibold text-slate-700">{money(r.service_revenue)}</td>
                          <td className="text-right tabular font-semibold text-slate-700">{money(r.retail_revenue)}</td>
                          <td>
                            {r.tier ? (
                              <span className="lss-badge bg-amber-100 text-amber-950 border border-amber-300 font-extrabold">
                                {money(r.tier.min)}–
                                {r.tier.max < 99999999 ? money(r.tier.max) : "∞"}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-semibold text-xs">Below threshold</span>
                            )}
                          </td>
                          <td className="text-right tabular font-extrabold text-amber-800">{money(r.daily_bonus)}</td>
                          <td className="text-right tabular font-extrabold text-emerald-800">{money(r.product_incentive || 0)}</td>
                          <td className="text-right tabular font-extrabold text-slate-950 bg-slate-50/50">{money(r.total_earned)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {daily.rows.length > 0 && (
                      <tfoot className="bg-slate-100/80 font-extrabold border-t-2 border-slate-300">
                        <tr>
                          <td className="py-3.5 px-4 text-slate-950">TOTAL</td>
                          <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(daily.rows.reduce((s, r) => s + (r.service_revenue || 0), 0))}</td>
                          <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(daily.rows.reduce((s, r) => s + (r.retail_revenue || 0), 0))}</td>
                          <td className="py-3.5 px-4 text-slate-400 text-xs">—</td>
                          <td className="text-right tabular py-3.5 px-4 text-amber-900">{money(daily.rows.reduce((s, r) => s + (r.daily_bonus || 0), 0))}</td>
                          <td className="text-right tabular py-3.5 px-4 text-emerald-900">{money(daily.rows.reduce((s, r) => s + (r.product_incentive || 0), 0))}</td>
                          <td className="text-right tabular py-3.5 px-4 text-slate-950 bg-amber-500/10">{money(daily.rows.reduce((s, r) => s + (r.total_earned || 0), 0))}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}
          </motion.div>
        )}

        {tab === "monthly" && (
          <motion.div key="monthly" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <DatePicker
                type="month"
                value={month}
                posDates={dates}
                onChange={(e) => setMonth(e.target.value)}
              />
              <a
                href={`${API}/reports/monthly-incentives.xlsx?month=${month}`}
                data-testid="monthly-export"
                className="lss-btn-gold px-4 py-2 text-xs uppercase tracking-wider font-bold ml-auto self-end"
              >
                Export Excel
              </a>
            </div>
            {loading ? (
              <div className="p-4 space-y-4 animate-pulse">
                <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
              </div>
            ) : monthly && (
              <div className="lss-card overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="lss-table" data-testid="monthly-table">
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th className="text-right">Base Salary</th>
                      <th className="text-right">Monthly Service ₹</th>
                      <th className="text-right">Ratio (×)</th>
                      <th className="text-right">Slab %</th>
                      <th className="text-right">Efficiency Bonus</th>
                      <th className="text-right">Retail Comm</th>
                      <th className="text-right">Prepaid Card Bonus</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.rows.map((r) => (
                      <tr key={r.staff_id}>
                        <td className="font-extrabold text-slate-950">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadDetailData(r.staff_name, "monthly", month)}
                              className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <span>{r.staff_name}</span>
                          </div>
                        </td>
                        <td className="text-right tabular font-semibold text-slate-700">{money(r.base_salary)}</td>
                        <td className="text-right tabular font-semibold text-slate-700">{money(r.monthly_service_revenue)}</td>
                        <td className="text-right tabular font-extrabold text-slate-950">{r.ratio}×</td>
                        <td className="text-right tabular font-extrabold text-amber-800">{r.pct}%</td>
                        <td className="text-right tabular font-semibold text-slate-700">{money(r.efficiency_bonus)}</td>
                        <td className="text-right tabular font-extrabold text-emerald-800">{money(r.retail_commission)}</td>
                        <td className="text-right tabular font-extrabold text-amber-800">{money(r.prepaid_card_bonus || 0)}</td>
                        <td className="text-right tabular font-extrabold text-slate-950 bg-slate-50/50">{money(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {monthly.rows.length > 0 && (
                    <tfoot className="bg-slate-100/80 font-extrabold border-t-2 border-slate-300">
                      <tr>
                        <td className="py-3.5 px-4 text-slate-950">TOTAL</td>
                        <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(monthly.rows.reduce((s, r) => s + (r.base_salary || 0), 0))}</td>
                        <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(monthly.rows.reduce((s, r) => s + (r.monthly_service_revenue || 0), 0))}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs text-right">—</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs text-right">—</td>
                        <td className="text-right tabular py-3.5 px-4 text-slate-800">{money(monthly.rows.reduce((s, r) => s + (r.efficiency_bonus || 0), 0))}</td>
                        <td className="text-right tabular py-3.5 px-4 text-emerald-900">{money(monthly.rows.reduce((s, r) => s + (r.retail_commission || 0), 0))}</td>
                        <td className="text-right tabular py-3.5 px-4 text-amber-900">{money(monthly.rows.reduce((s, r) => s + (r.prepaid_card_bonus || 0), 0))}</td>
                        <td className="text-right tabular py-3.5 px-4 text-slate-950 bg-amber-500/10">{money(monthly.rows.reduce((s, r) => s + (r.total || 0), 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </motion.div>
        )}

        {tab === "cumulative" && (
          <CumulativeReport key="cumulative" onViewDetails={(staffName, unpaidDays) => {
            setDetailStaffName(staffName);
            setDetailType("cumulative");
            setCumulativeUnpaidDays(unpaidDays);
            setDetailOpen(true);
            setDetailData(null);
          }} />
        )}

        {tab === "manager" && manager && (
          <motion.div key="manager" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="max-w-3xl">
            <div className="lss-card p-8 border-t-4 border-amber-500">
              <div className="lss-overline">Salon revenue this month</div>
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-950 mt-2 tabular" data-testid="manager-revenue">
                {money(manager.revenue)}
              </div>
              <div className="text-sm font-semibold text-slate-600 mt-2">
                {manager.milestone
                  ? `Milestone hit at ${money(manager.milestone.min_revenue)} — ${money(manager.bonus_per_manager)} per manager`
                  : "No milestone reached yet"}
              </div>
              <div className="mt-8 space-y-4">
                {manager.milestones.map((m) => {
                  const hit = manager.revenue >= m.min_revenue;
                  const progress = Math.min(100, (manager.revenue / m.min_revenue) * 100);
                  return (
                    <div key={m.min_revenue} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex justify-between text-sm font-extrabold mb-2">
                        <div className={hit ? "text-amber-900 font-extrabold" : "text-slate-700"}>
                          Target: {money(m.min_revenue)}
                        </div>
                        <div className="tabular text-slate-950">
                          ₹{m.bonus_per_manager.toLocaleString("en-IN")} × 2 managers
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${hit ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-slate-400"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      {detailOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950 font-serif-lux">Incentive Calculation Source</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  {detailStaffName} — {detailType === "daily" ? `Daily (${detailDate})` : detailType === "monthly" ? `Monthly (${detailDate})` : `Cumulative Unpaid Report`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {detailLoading ? (
                <div className="p-4 space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-200 rounded w-full"></div>)}
                </div>
              ) : detailType === "cumulative" ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Unpaid Days</span>
                      <span className="text-2xl font-extrabold text-slate-950">{cumulativeUnpaidDays.length}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Total Due</span>
                      <span className="text-2xl font-extrabold text-amber-900">{money(cumulativeUnpaidDays.reduce((acc, d) => acc + d.total, 0))}</span>
                    </div>
                  </div>

                  <div className="lss-card border border-slate-200 rounded-xl overflow-hidden">
                    <table className="lss-table w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 text-xs uppercase font-extrabold">
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Service Rev</th>
                          <th className="p-3 text-right">Daily Bonus</th>
                          <th className="p-3 text-right">Product Inc</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cumulativeUnpaidDays.map((d) => (
                          <tr key={d.day} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-900">{d.day}</td>
                            <td className="p-3 text-right tabular font-medium">{money(d.service)}</td>
                            <td className="p-3 text-right tabular font-bold text-amber-800">{money(d.bonus)}</td>
                            <td className="p-3 text-right tabular font-bold text-emerald-800">{money(d.product_incentive)}</td>
                            <td className="p-3 text-right tabular font-extrabold text-slate-950">{money(d.total)}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => loadDetailData(detailStaffName, "daily", d.day)}
                                className="lss-btn-gold px-3.5 py-1.5 text-xs font-bold uppercase"
                              >
                                View Transactions
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : detailData ? (
                <div className="space-y-6 text-slate-900">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Base Salary</span>
                      <span className="text-xl font-extrabold text-slate-950">{money(detailData.base_salary)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Service Rev</span>
                      <span className="text-xl font-extrabold text-slate-950">{money(detailData.total_service)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Retail Rev</span>
                      <span className="text-xl font-extrabold text-slate-950">{money(detailData.total_retail)}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">Total Earned</span>
                      <span className="text-xl font-extrabold text-slate-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">{money(detailData.total_earned)}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">Calculation Details</h4>
                    <div className="text-sm space-y-1.5 text-slate-800">
                      {detailType === "daily" ? (
                        <>
                          <div className="bg-amber-100/60 p-2 rounded-lg text-xs text-amber-950 font-medium mb-1">
                            <span className="font-bold">Formula Applied: </span>
                            Eligible Service Amount = Net Amount − (50% × Value Card Amount). Incentive tier evaluated on daily sum of eligible services.
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Daily Eligible Service Total: </span>
                            <span className="font-extrabold text-slate-950">{money(detailData.total_service)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Daily Bonus: </span>
                            {detailData.tier ? (
                              <span className="font-bold text-slate-900">
                                {money(detailData.daily_bonus)} (Hit Tier {money(detailData.tier.min)}–{detailData.tier.max < 99999999 ? money(detailData.tier.max) : "∞"})
                              </span>
                            ) : (
                              <span className="text-slate-500">₹0 (Below threshold of {money(detailData.config_tiers?.[0]?.min || 2500)})</span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Product Incentives: </span>
                            <span className="font-bold text-slate-900">{money(detailData.product_incentive)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Retail Commission (Legacy): </span>
                            <span className="font-bold text-slate-900">{money(detailData.retail_commission)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="font-semibold text-slate-600">Revenue-to-Salary Ratio: </span>
                            <span className="font-bold text-slate-900">{detailData.ratio}x</span> (Service Rev {money(detailData.total_service)} / Base Salary {money(detailData.base_salary)})
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Slab Percentage: </span>
                            <span className="font-bold text-slate-900">{detailData.pct}%</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Efficiency Bonus: </span>
                            <span className="font-bold text-slate-900">{money(detailData.efficiency_bonus)}</span> ({detailData.pct}% of {money(detailData.total_service)})
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Retail Commission: </span>
                            <span className="font-bold text-slate-900">{money(detailData.retail_commission)}</span>
                          </div>
                          {detailData.prepaid_card_bonus > 0 && (
                            <div>
                              <span className="font-semibold text-slate-600">Prepaid Card Bonus: </span>
                              <span className="font-bold text-slate-900">{money(detailData.prepaid_card_bonus)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 mb-3">POS Transactions Breakup</h4>
                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[300px]">
                      <table className="lss-table w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 text-xs uppercase font-extrabold sticky top-0 z-10 shadow-xs">
                            <th className="p-3">Date</th>
                            <th className="p-3">Invoice</th>
                            <th className="p-3">Client</th>
                            <th className="p-3">Item Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Net Price</th>
                            <th className="p-3 text-right">Value Card</th>
                            <th className="p-3 text-right">Share %</th>
                            <th className="p-3 text-right">Share Val</th>
                            {detailType === "daily" && <th className="p-3 text-right">Product Inc</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.details && detailData.details.map((t, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-3 text-slate-600 text-xs tabular font-medium">{t.date}</td>
                              <td className="p-3 text-slate-900 text-xs font-semibold">{t.invoice_number}</td>
                              <td className="p-3 text-slate-700 text-xs font-medium">{t.client}</td>
                              <td className="p-3 text-slate-950 text-xs font-bold">{t.item_name}</td>
                              <td className="p-3 text-xs font-semibold">
                                <span className={`lss-badge ${t.type?.toLowerCase() === 'service' ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-3 text-right tabular text-xs font-medium">{money(t.net_price)}</td>
                              <td className="p-3 text-right tabular text-xs font-medium text-amber-900">{money(t.value_card_paid || 0)}</td>
                              <td className="p-3 text-right tabular text-xs font-bold text-slate-600">{t.share_pct}%</td>
                              <td className="p-3 text-right tabular text-xs font-bold text-slate-900">{money(t.share_value)}</td>
                              {detailType === "daily" && (
                                <td className="p-3 text-right tabular text-xs font-bold text-emerald-800">{money(t.incentive || 0)}</td>
                              )}
                            </tr>
                          ))}
                          {(!detailData.details || detailData.details.length === 0) && (
                            <tr>
                              <td colSpan={detailType === "daily" ? 9 : 8} className="text-center text-slate-500 font-medium py-8 text-xs">
                                No transactions found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-end shrink-0 gap-3">
              {detailType === "daily" && cumulativeUnpaidDays.length > 0 && (
                <button
                  onClick={() => {
                    setDetailType("cumulative");
                    setDetailData(null);
                  }}
                  className="lss-btn-gold mr-auto px-4 py-2 text-xs font-bold uppercase"
                >
                  ← Back to Cumulative List
                </button>
              )}
              <button
                onClick={() => setDetailOpen(false)}
                className="lss-btn-gold px-5 py-2 text-xs font-bold uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
