import { useEffect, useState } from "react";
import api, { money, errMsg } from "../lib/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  PackageSearch,
  ShieldAlert,
  BadgeCheck,
  ArrowRight,
  TrendingUp,
  Crown,
  PieChart as PieIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const MetricCard = ({ label, value, sub, trend, icon: Icon, testid }) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="neu-card p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between"
      data-testid={testid}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-3 rounded-2xl neu-inset text-amber-800">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{label}</span>
          </div>
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full neu-inset ${
              trend.startsWith("-") 
                ? "text-rose-700" 
                : "text-emerald-700"
            }`}>
              {trend.startsWith("-") ? "" : <TrendingUp className="w-3 h-3" />} {trend}
            </span>
          )}
        </div>
        <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 mt-5 tabular" data-testid={`${testid}-value`}>
          {value}
        </div>
      </div>
      {sub && <div className="text-xs text-slate-600 font-semibold mt-4 pt-3 border-t border-[#ded4c6]/50">{sub}</div>}
    </motion.div>
  );
};

export default function OwnerDashboard() {
  const [data, setData] = useState({
    working_capital: 0,
    sku_count: 0,
    quality_alerts: 0,
    leakage_units: 0,
    total_service_revenue: 0,
    total_retail_revenue: 0,
    pending_payouts: 0,
    staff_count: 0,
    monthly_chart: [
      { month: "May", revenue: 1420000 },
      { month: "Jun", revenue: 1680000 },
      { month: "Jul", revenue: 1950000 },
      { month: "Aug", revenue: 2100000 }
    ]
  });
  const [managerBonus, setManagerBonus] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/owner")
      .then((r) => {
        if (r.data) setData((prev) => ({ ...prev, ...r.data }));
      })
      .catch((e) => console.error("Dashboard error:", e));
    const month = new Date().toISOString().slice(0, 7);
    api.get(`/incentives/manager?month=${month}`).then((r) => setManagerBonus(r.data)).catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="p-6 sm:p-10 relative max-w-7xl mx-auto space-y-8 pb-10">
      {/* Executive Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-6 py-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-amber-800" />
            <span className="text-slate-600 font-extrabold text-xs uppercase tracking-widest">
              EXECUTIVE COMMAND SUITE
            </span>
          </div>
          <h1 className="font-serif-lux text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Working Capital & Live Operations
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
            Real-time enterprise metrics across inventory valuation, staff payout calculations, quality control audits, and manager milestone bonuses.
          </p>
        </div>

        {/* Framed Aesthetic Salon Image Card */}
        <div className="hidden lg:block relative neu-card p-2 h-40 w-72 shrink-0 overflow-hidden">
          <img src="/assets/salon_plants.png" alt="Salon Aesthetic" className="w-full h-full object-cover rounded-2xl" />
        </div>
      </motion.div>

      {data ? (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <motion.div variants={itemVariants}>
              <MetricCard
                testid="working-capital"
                label="Working Capital (Stock at Cost)"
                value={money(data.working_capital)}
                sub={`${data.sku_count} SKUs across Store + Floor`}
                trend="+8.4%"
                icon={Wallet}
                color="green"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MetricCard
                testid="quality-alerts"
                label="Critical Quality Failures"
                value={data.quality_alerts}
                sub="100%-discounted services flagged"
                trend="-0.5%"
                icon={ShieldAlert}
                color="red"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MetricCard
                testid="leakage-units"
                label="Inventory Leakage (Units)"
                value={data.leakage_units}
                sub="Checkouts - Product units billed"
                trend="0.0%"
                icon={PackageSearch}
                color="gold"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MetricCard
                testid="service-revenue"
                label="Service Revenue (all time)"
                value={money(data.total_service_revenue)}
                trend="+14.2%"
                icon={TrendingUp}
                isGold={true}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MetricCard
                testid="retail-revenue"
                label="Retail Revenue (all time)"
                value={money(data.total_retail_revenue)}
                trend="+6.1%"
                icon={BadgeCheck}
                isGold={false}
              />
            </motion.div>
          </motion.div>

          {/* Executive Capital & Revenue Allocation Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lss-card p-6 sm:p-8 mt-8 border-t-4 border-amber-500"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="lss-overline text-amber-800 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-amber-600" />
                  Asset & Revenue Valuation
                </div>
                <h3 className="font-serif-lux text-2xl text-slate-950 font-bold mt-1">
                  Enterprise Financial Overview
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span> Working Capital
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Service Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Retail Sales
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
                <BarChart
                  data={[
                    { name: "Working Capital", amount: data.working_capital, fill: "#0F172A" },
                    { name: "Service Sales", amount: data.total_service_revenue, fill: "#10B981" },
                    { name: "Retail Sales", amount: data.total_retail_revenue, fill: "#D97706" },
                    { name: "Pending Payouts", amount: data.pending_payouts, fill: "#6366F1" },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: "#475569" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Valuation"]}
                    contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff", border: "none" }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {[
                      { fill: "#0F172A" },
                      { fill: "#10B981" },
                      { fill: "#D97706" },
                      { fill: "#6366F1" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Manager Milestone Progress Tracker */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lss-card p-6 sm:p-8 border-t-4 border-amber-500"
            >
              <div className="lss-overline text-amber-800">Manager Milestone Tracker</div>
              <h3 className="font-serif-lux text-3xl text-slate-950 font-bold mt-2">
                {managerBonus ? money(managerBonus.revenue) : "—"}
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                {managerBonus?.milestone
                  ? `Milestone hit: ${money(managerBonus.milestone.min_revenue)} → ${money(
                      managerBonus.bonus_per_manager
                    )} per manager`
                  : "No milestone hit yet this month"}
              </div>

              {managerBonus && (
                <div className="mt-6 space-y-4">
                  {managerBonus.milestones.map((m) => {
                    const hit = managerBonus.revenue >= m.min_revenue;
                    const pct = Math.min(100, Math.round((managerBonus.revenue / m.min_revenue) * 100));
                    return (
                      <div key={m.min_revenue} className="space-y-1.5">
                        <div
                          className={`flex items-center justify-between text-xs sm:text-sm p-3 rounded-xl border transition-all ${
                            hit
                              ? "bg-amber-50/90 border-amber-300/80 text-amber-950 font-bold shadow-xs"
                              : "bg-slate-50/70 border-slate-200 text-slate-700 font-medium"
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Target: {money(m.min_revenue)}</span>
                          </div>
                          <div className={`tabular font-extrabold ${hit ? "text-amber-900" : "text-slate-500"}`}>
                            {hit ? "✓ " : ""}₹{m.bonus_per_manager.toLocaleString("en-IN")} each
                          </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              hit
                                ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-xs"
                                : "bg-slate-400"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Quick Action Navigation Links */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lss-card p-6 sm:p-8 border-t-4 border-slate-950"
            >
              <div className="lss-overline text-slate-700">Next Best Actions</div>
              <h3 className="font-serif-lux text-3xl text-slate-950 font-bold mt-2">Actionable Operations</h3>
              <div className="mt-6 space-y-3">
                <Link
                  to="/inventory"
                  data-testid="quick-review-inventory"
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl transition-all group shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-slate-950 font-extrabold text-sm">Check auto-drafted POs</div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        Review lead time replenishment orders
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-amber-600 group-hover:translate-x-1.5 transition-all" />
                </Link>

                <Link
                  to="/quality"
                  data-testid="quick-review-quality"
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-rose-400 rounded-xl transition-all group shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-rose-900 text-rose-100 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-slate-950 font-extrabold text-sm">Investigate quality failures</div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        100%-discounted service logs and risk escalations
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-rose-600 group-hover:translate-x-1.5 transition-all" />
                </Link>
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse mt-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>
          ))}
          <div className="col-span-1 md:col-span-2 xl:col-span-3 h-96 bg-slate-200 rounded-2xl mt-4"></div>
        </div>
      )}

    </div>
  );
}
