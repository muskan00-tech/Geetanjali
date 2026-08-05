import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  Award,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { motion } from "framer-motion";
import api from "../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = ["#0F172A", "#D97706", "#10B981", "#6366F1", "#EC4899", "#8B5CF6"];

export default function SalesAnalyticsPage() {
  const [salesBreakdown, setSalesBreakdown] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pageLoading, setPageLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get("/analytics/sales"),
        api.get(`/analytics/staff-performance?month=${month}`),
      ]);
      setSalesBreakdown(bRes.data?.breakdown || []);
      setStaffPerf(sRes.data?.staff || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalRevenue = salesBreakdown.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalTxns = salesBreakdown.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalDiscounts = salesBreakdown.reduce((sum, item) => sum + (item.total_discount || 0), 0);
  const avgTicket = totalTxns ? Math.round(totalRevenue / totalTxns) : 0;

  const productData = salesBreakdown.find((x) => x.type?.toLowerCase() === "product") || { revenue: 0, count: 0 };
  const retailRatio = totalRevenue ? ((productData.revenue / totalRevenue) * 100).toFixed(1) : 0;

  // Chart Data Preparation
  const pieChartData = salesBreakdown.map((item) => ({
    name: item.type,
    value: item.revenue || 0,
    count: item.count,
    discounts: item.total_discount,
  }));

  const sortedStaff = [...staffPerf].sort((a, b) => {
    const combinedA = (a.service_revenue || 0) + (a.retail_revenue || 0);
    const combinedB = (b.service_revenue || 0) + (b.retail_revenue || 0);
    return combinedB - combinedA;
  });

  const staffBarChartData = sortedStaff.slice(0, 8).map((s) => ({
    name: s.name.split(" ")[0] || s.name,
    fullName: s.name,
    Service: Math.round(s.service_revenue || 0),
    Retail: Math.round(s.retail_revenue || 0),
    Combined: Math.round((s.service_revenue || 0) + (s.retail_revenue || 0)),
  }));

  if (pageLoading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-2xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 py-2 border-b border-[#E6DACD]/60 pb-6"
      >
        <div>
          <div className="lss-overline text-amber-800 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            EXECUTIVE REVENUE INTELLIGENCE
          </div>
          <h1 className="font-serif-lux text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-600 shrink-0" /> Sales Analytics & Insights
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
            Real-time sales distribution, staff contribution rankings, and service-to-retail conversion ratios.
          </p>
        </div>

        <div className="flex items-center gap-4 self-end lg:self-center shrink-0">
          <DatePicker type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          {/* Framed Aesthetic Salon Image Card */}
          <div className="hidden xl:block relative neu-card p-2 h-36 w-64 overflow-hidden shrink-0">
            <img src="/assets/salon_plants.png" alt="Salon Aesthetic" className="w-full h-full object-cover rounded-2xl" />
          </div>
        </div>
      </motion.div>

      {/* Top Level Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-amber-500/40 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Gross Sales</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold mt-3 tabular tracking-tight text-white">
            ₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Live POS
            </span>
            <span>{totalTxns} total invoices</span>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="lss-card p-6 border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Average Ticket Size</span>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold mt-3 text-slate-900 tabular">
            ₹{avgTicket.toLocaleString()}
          </div>
          <div className="mt-3 text-xs font-medium text-slate-600">
            Avg revenue generated per invoice ticket
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="lss-card p-6 border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Retail Product Share</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold mt-3 text-slate-900 tabular flex items-baseline gap-2">
            <span>{retailRatio}%</span>
            <span className="text-xs font-semibold text-emerald-700">₹{productData.revenue?.toLocaleString() || 0}</span>
          </div>
          <div className="mt-3 text-xs font-medium text-slate-600">
            {productData.count || 0} retail product units sold
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="lss-card p-6 border-slate-200">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Total Discounts Granted</span>
            <Layers className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold mt-3 text-rose-900 tabular">
            ₹{totalDiscounts.toLocaleString()}
          </div>
          <div className="mt-3 text-xs font-medium text-slate-600">
            Membership, manager & offer discounts
          </div>
        </motion.div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Revenue Distribution Donut Chart */}
        <div className="lg:col-span-5 lss-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="lss-overline text-amber-900">Revenue Breakdown</span>
              <PieIcon className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Sales Category Share</h3>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Visual proportion of Service vs Product vs Advance collections
            </p>
          </div>

          <div className="h-64 my-4 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff", border: "none" }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px", fontWeight: "600" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {salesBreakdown.map((item, idx) => {
              const pct = totalRevenue ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0;
              return (
                <div key={item.type} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="font-bold text-slate-800">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-950">₹{item.revenue?.toLocaleString()}</span>
                    <span className="text-slate-600 font-bold tabular w-12 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Sales Performance Bar Chart */}
        <div className="lg:col-span-7 lss-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="lss-overline text-indigo-900">Staff Contribution</span>
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Top Stylist & Staff Revenue Chart ({month})</h3>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Comparison of Service Revenue vs Retail Product Sales by staff member
            </p>
          </div>

          <div className="h-72 my-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
              <BarChart data={staffBarChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name]}
                  contentStyle={{ backgroundColor: "#0F172A", borderRadius: "12px", color: "#fff", border: "none" }}
                />
                <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: "12px", fontWeight: "700" }} />
                <Bar dataKey="Service" fill="#0F172A" radius={[4, 4, 0, 0]} name="Service Revenue" />
                <Bar dataKey="Retail" fill="#D97706" radius={[4, 4, 0, 0]} name="Retail Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs font-semibold text-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Top Revenue Contributor: <strong className="text-amber-900 uppercase font-black">{sortedStaff[0]?.name || "N/A"}</strong></span>
            </div>
            <span className="font-extrabold text-emerald-800">
              ₹{((sortedStaff[0]?.service_revenue || 0) + (sortedStaff[0]?.retail_revenue || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Staff Leaderboard Table */}
      <div className="lss-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <div className="lss-overline text-emerald-900">Leaderboard Rankings</div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" /> Staff Driven Revenue Performance ({month})
            </h3>
          </div>
          <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {sortedStaff.length} active staff members
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
          <table className="lss-table text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="py-3 px-4 text-left w-12">Rank</th>
                <th className="py-3 px-4 text-left">Staff Member</th>
                <th className="py-3 px-4 text-right">Service Revenue</th>
                <th className="py-3 px-4 text-center">Services</th>
                <th className="py-3 px-4 text-right">Retail Revenue</th>
                <th className="py-3 px-4 text-center">Products</th>
                <th className="py-3 px-4 text-right">Combined Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sortedStaff.map((s, idx) => {
                const combined = (s.service_revenue || 0) + (s.retail_revenue || 0);
                const rankBadge =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                return (
                  <tr key={s.name} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 text-center text-sm">{rankBadge}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{s.name}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 tabular">
                      ₹{s.service_revenue?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold tabular">
                      {s.service_count}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700 tabular">
                      ₹{s.retail_revenue?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold tabular">
                      {s.retail_count}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-950 text-sm tabular bg-slate-50/50">
                      ₹{combined.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {sortedStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No staff sales performance records found for {month}.
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
