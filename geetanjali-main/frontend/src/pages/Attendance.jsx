import { useState, useEffect } from "react";
import { Clock, UserCheck, DollarSign, Plus, Edit2, Trash2, X, Settings, Users, Save } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import api, { errMsg } from "../lib/api";

export default function AttendancePage() {
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Bulk Salary Manager Modal States
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryRows, setSalaryRows] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salarySaving, setSalarySaving] = useState(false);

  const handleOpenSalaryManager = async () => {
    setShowSalaryModal(true);
    setSalaryLoading(true);
    try {
      const res = await api.get("/staff");
      const staff = (res.data || []).map((s) => ({
        id: s.id,
        name: s.name || "",
        department: s.department || s.role || "STYLIST",
        base_salary: s.base_salary || 0,
        _new: false,
        _delete: false,
      }));
      setSalaryRows(staff);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleSalaryRowChange = (idx, field, val) => {
    setSalaryRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const handleAddSalaryRow = () => {
    setSalaryRows((prev) => [...prev, { id: `new_${Date.now()}`, name: "", department: "STYLIST", base_salary: 25000, _new: true, _delete: false }]);
  };

  const handleDeleteSalaryRow = (idx) => {
    setSalaryRows((prev) => prev.map((r, i) => i === idx ? { ...r, _delete: true } : r));
  };

  const handleSaveAllSalaries = async () => {
    setSalarySaving(true);
    let saved = 0, deleted = 0, errors = 0;
    try {
      for (const row of salaryRows) {
        if (!row.name.trim()) continue;
        try {
          if (row._delete && !row._new) {
            await api.delete(`/staff/${row.id}`);
            deleted++;
          } else if (!row._delete) {
            if (row._new) {
              await api.post("/staff", { name: row.name, base_salary: Number(row.base_salary), department: row.department, role: row.department === "MANAGER" ? "manager" : "staff" });
            } else {
              await api.put(`/staff/${row.id}`, { name: row.name, base_salary: Number(row.base_salary), department: row.department });
            }
            saved++;
          }
        } catch { errors++; }
      }
      toast.success(`Saved ${saved} staff profiles${deleted > 0 ? `, removed ${deleted}` : ""}`);
      setShowSalaryModal(false);
      fetchStaff();
      fetchAttendance();
      fetchSummary();
    } finally {
      setSalarySaving(false);
    }
  };

  useEffect(() => {
    setPageLoading(true);
    Promise.all([fetchStaff(), fetchAttendance(), fetchSummary()]).finally(() => setPageLoading(false));
  }, [month]);

  const fetchStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaffList(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/attendance?month=${month}`);
      setAttendance(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/attendance/summary?month=${month}`);
      setSummary(res.data?.summaries || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: staffForm.name,
        role: staffForm.role,
        base_salary: Number(staffForm.base_salary) || 0,
      };
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, payload);
      } else {
        await api.post("/staff", payload);
      }
      toast.success(editingStaff ? "Staff updated successfully" : "Staff member added successfully");
      setEditingStaff(null);
      setIsAddingNew(false);
      setStaffForm({ name: "", role: "STYLIST", base_salary: 25000 });
      fetchStaff();
      fetchSummary();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/staff/${staffId}`);
      toast.success(`Deleted ${name}`);
      fetchStaff();
      fetchSummary();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (staffId) => {
    setLoading(true);
    try {
      await api.post(`/attendance/clock-in?staff_id=${staffId}`);
      toast.success("Clocked in successfully");
      fetchAttendance();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (staffId) => {
    setLoading(true);
    try {
      await api.post(`/attendance/clock-out?staff_id=${staffId}`);
      toast.success("Clocked out successfully");
      fetchAttendance();
      fetchSummary();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="h-96 bg-slate-200 rounded-xl w-full"></div>
    </div>
  );

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="lss-overline">Shift Management</div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
            <Clock className="w-7 h-7 text-slate-900" /> Staff & Attendance
          </h1>
          <p className="text-slate-600 font-medium text-sm mt-1">Clock-in/out tracking & automated salary calculations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenSalaryManager}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Users className="w-4 h-4 text-amber-400" />
            Manage Salary Structure
          </button>
          <DatePicker
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Clock In / Out Quick Actions */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" /> Shift Clock-In / Out
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {staffList.map((st) => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayRec = attendance.find((a) => a.staff_id === st.id && a.date === todayStr);
            return (
              <div key={st.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="font-bold text-slate-900 text-base">{st.name}</div>
                  <div className="text-xs text-slate-600 font-semibold capitalize mt-0.5">{st.role} · Base ₹{st.base_salary?.toLocaleString()}</div>
                  <div className="mt-2 text-xs font-semibold">
                    Status:{" "}
                    <span className={todayRec?.clock_out ? "text-blue-700" : todayRec?.clock_in ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      {todayRec?.clock_out ? `Clocked Out (${todayRec.hours_worked}h)` : todayRec?.clock_in ? "Working Now" : "Not Clocked In"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    disabled={loading || !!todayRec?.clock_in}
                    onClick={() => handleClockIn(st.id)}
                    className="flex-1 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-md transition shadow-xs"
                  >
                    Clock In
                  </button>
                  <button
                    disabled={loading || !todayRec?.clock_in || !!todayRec?.clock_out}
                    onClick={() => handleClockOut(st.id)}
                    className="flex-1 py-2 text-xs font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white rounded-md transition shadow-xs"
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Salary & Attendance Summary */}
      <div className="lss-card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" /> Monthly Salary & Attendance Breakdown ({month})
        </h2>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="lss-table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Base Salary</th>
                <th>Days Present</th>
                <th>Half Days</th>
                <th>Absent</th>
                <th>Effective Days</th>
                <th>Total Hours</th>
                <th className="text-right">Calculated Base Pay</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.staff_id}>
                  <td className="font-bold text-slate-900">{row.staff_name}</td>
                  <td className="text-slate-700 font-medium">
                    ₹{row.base_salary?.toLocaleString()}
                  </td>
                  <td className="text-emerald-700 font-bold">{row.days_present}</td>
                  <td className="text-amber-700 font-bold">{row.days_half_day}</td>
                  <td className="text-rose-700 font-bold">{row.days_absent}</td>
                  <td className="text-slate-900 font-medium">{row.effective_days} / 30</td>
                  <td className="text-slate-700 font-medium">{row.total_hours} hrs</td>
                  <td className="text-right font-extrabold text-slate-900 tabular">
                    ₹{row.calculated_salary?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Structure Manager Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-700" /> Salary Structure — Geetanjali Salon
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Edit, add or remove staff. Changes save permanently to the database.</p>
              </div>
              <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {salaryLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500 py-2 pr-3 w-8">#</th>
                      <th className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500 py-2 pr-3">Employee Name</th>
                      <th className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500 py-2 pr-3">Designation</th>
                      <th className="text-right text-xs font-extrabold uppercase tracking-wider text-slate-500 py-2 pr-3">Base Salary (₹)</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRows.filter(r => !r._delete).map((row, idx) => {
                      const realIdx = salaryRows.indexOf(row);
                      return (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                          <td className="py-2 pr-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-1.5 pr-3">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleSalaryRowChange(realIdx, "name", e.target.value)}
                              className="w-full px-3 py-1.5 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              placeholder="Staff name"
                            />
                          </td>
                          <td className="py-1.5 pr-3">
                            <input
                              type="text"
                              value={row.department}
                              onChange={(e) => handleSalaryRowChange(realIdx, "department", e.target.value)}
                              className="w-full px-3 py-1.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              placeholder="e.g. STYLIST, MANAGER"
                            />
                          </td>
                          <td className="py-1.5 pr-3">
                            <input
                              type="number"
                              step="500"
                              value={row.base_salary}
                              onChange={(e) => handleSalaryRowChange(realIdx, "base_salary", e.target.value)}
                              className="w-full px-3 py-1.5 text-sm font-mono font-extrabold text-amber-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-right"
                            />
                          </td>
                          <td className="py-1.5 pl-1">
                            <button
                              onClick={() => handleDeleteSalaryRow(realIdx)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove this staff"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                      <td colSpan={3} className="py-3 px-2 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Total Monthly Salary</td>
                      <td className="py-3 pr-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                        ₹{salaryRows.filter(r => !r._delete).reduce((s, r) => s + Number(r.base_salary || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
              <button
                onClick={handleAddSalaryRow}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-amber-800 hover:text-amber-950 hover:bg-amber-50 rounded-xl transition-colors border border-amber-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Staff
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">{salaryRows.filter(r => !r._delete).length} staff · {salaryRows.filter(r => r._delete && !r._new).length > 0 ? `${salaryRows.filter(r => r._delete && !r._new).length} to remove` : ""}</span>
                <button onClick={() => setShowSalaryModal(false)} className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button
                  onClick={handleSaveAllSalaries}
                  disabled={salarySaving}
                  className="flex items-center gap-2 lss-btn-gold px-5 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl"
                >
                  <Save className="w-3.5 h-3.5" />
                  {salarySaving ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
