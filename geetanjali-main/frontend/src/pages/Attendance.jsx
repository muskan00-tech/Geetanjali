import { useState, useEffect } from "react";
import { Clock, UserCheck, DollarSign, Plus, Edit2, Trash2, X, Settings } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export default function AttendancePage() {
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Staff management modal states
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", role: "STYLIST", base_salary: 25000 });

  useEffect(() => {
    setPageLoading(true);
    Promise.all([fetchStaff(), fetchAttendance(), fetchSummary()]).finally(() => setPageLoading(false));
  }, [month]);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/staff`, { credentials: "include" });
      if (res.ok) setStaffList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/attendance?month=${month}`, { credentials: "include" });
      if (res.ok) setAttendance(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/attendance/summary?month=${month}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summaries || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingStaff ? `${BACKEND}/api/staff/${editingStaff.id}` : `${BACKEND}/api/staff`;
      const method = editingStaff ? "PUT" : "POST";
      const payload = {
        name: staffForm.name,
        role: staffForm.role,
        base_salary: Number(staffForm.base_salary) || 0,
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingStaff ? "Staff updated successfully" : "Staff member added successfully");
        setEditingStaff(null);
        setIsAddingNew(false);
        setStaffForm({ name: "", role: "STYLIST", base_salary: 25000 });
        fetchStaff();
        fetchSummary();
      } else {
        toast.error(data.detail || "Failed to save staff");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/staff/${staffId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success(`Deleted ${name}`);
        fetchStaff();
        fetchSummary();
      } else {
        toast.error("Failed to delete staff member");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (staffId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/attendance/clock-in?staff_id=${staffId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Clocked in ${data.staff_name}`);
        fetchAttendance();
        fetchSummary();
      } else {
        toast.error(data.detail || "Clock-in failed");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (staffId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/attendance/clock-out?staff_id=${staffId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Clocked out ${data.staff_name} (${data.hours_worked} hrs)`);
        fetchAttendance();
        fetchSummary();
      } else {
        toast.error(data.detail || "Clock-out failed");
      }
    } catch (e) {
      toast.error("Network error");
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
            onClick={() => setShowStaffModal(true)}
            className="lss-btn bg-slate-950 text-white font-extrabold py-2.5 px-4 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition text-sm shadow-sm"
          >
            <Settings className="w-4 h-4 text-amber-500 animate-spin-slow" />
            Manage Salaries
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
                    <div className="flex items-center gap-1.5">
                      <span>₹{row.base_salary?.toLocaleString()}</span>
                      <button
                        onClick={() => {
                          const matched = staffList.find((st) => st.id === row.staff_id || st.name.toLowerCase() === row.staff_name.toLowerCase());
                          if (matched) {
                            setEditingStaff(matched);
                            setStaffForm({ name: matched.name, role: matched.role || matched.department || "STYLIST", base_salary: matched.base_salary });
                          } else {
                            setEditingStaff({ id: row.staff_id, name: row.staff_name });
                            setStaffForm({ name: row.staff_name, role: "STYLIST", base_salary: row.base_salary });
                          }
                          setShowStaffModal(true);
                        }}
                        className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                        title="Edit Salary & Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* Staff Management Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  Staff Directory & Salaries
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage employees, designations, and their monthly base pay</p>
              </div>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  setIsAddingNew(false);
                  setEditingStaff(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isAddingNew || editingStaff ? (
                /* Add / Edit Form */
                <form onSubmit={handleSaveStaff} className="space-y-4 max-w-md mx-auto">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    {editingStaff ? `Edit Profile: ${editingStaff.name}` : "Add New Employee"}
                  </h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                      Employee Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SIRAJ"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      disabled={!!editingStaff}
                      className="lss-input w-full text-xs font-bold text-slate-900 bg-slate-50 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                      Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className="lss-input w-full text-xs font-bold text-slate-950"
                      required
                    >
                      <option value="STYLIST">STYLIST</option>
                      <option value="ASIST">ASIST</option>
                      <option value="BARBER">BARBER</option>
                      <option value="BEAUTI">BEAUTI</option>
                      <option value="HOUSEKEPNG">HOUSEKEPNG</option>
                      <option value="PEDICURIST">PEDICURIST</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="staff">Staff (Other)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                      Base Salary (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 43000"
                      value={staffForm.base_salary}
                      onChange={(e) => setStaffForm({ ...staffForm, base_salary: e.target.value })}
                      className="lss-input w-full text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingStaff(null);
                        setStaffForm({ name: "", role: "STYLIST", base_salary: 25000 });
                      }}
                      className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg transition shadow-xs"
                    >
                      {loading ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Directory List Table */
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Staff Profiles ({staffList.length})</span>
                    <button
                      onClick={() => {
                        setStaffForm({ name: "", role: "STYLIST", base_salary: 25000 });
                        setIsAddingNew(true);
                      }}
                      className="lss-btn bg-slate-900 hover:bg-slate-800 text-white py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Staff
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50 max-h-96 overflow-y-auto">
                    <table className="lss-table text-xs">
                      <thead className="sticky top-0 bg-white z-10 shadow-xs">
                        <tr className="bg-slate-50 text-slate-700">
                          <th className="py-2.5 px-4 text-left">Employee Name</th>
                          <th className="py-2.5 px-4 text-left">Designation</th>
                          <th className="py-2.5 px-4 text-right">Base Salary</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((s) => (
                          <tr key={s.id} className="hover:bg-amber-50/20 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{s.name}</td>
                            <td className="py-2.5 px-4 text-slate-600 font-semibold">{s.role}</td>
                            <td className="py-2.5 px-4 text-right text-slate-900 font-bold tabular">
                              ₹{s.base_salary?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingStaff(s);
                                  setStaffForm({ name: s.name, role: s.role || "STYLIST", base_salary: s.base_salary || 25000 });
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                title="Edit Staff"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(s.id, s.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {staffList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                              No staff members in directory. Click "Add New Staff" to create one.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
