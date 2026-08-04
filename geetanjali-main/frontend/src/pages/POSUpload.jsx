import { useEffect, useRef, useState } from "react";
import api, { money, errMsg } from "../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowUpRight, Trash2 } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

export default function POSUpload() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [txns, setTxns] = useState([]);
  const [dates, setDates] = useState([]);
  const [day, setDay] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleResetPOS = async () => {
    if (!window.confirm("Are you sure you want to reset and clear ALL POS transactions? This action is destructive and cannot be undone.")) {
      return;
    }
    setBusy(true);
    try {
      await api.post("/pos/reset");
      toast.success("All POS transactions reset successfully.");
      setTxns([]);
      setDates([]);
      setDay(null);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const loadDates = () =>
    api.get("/pos/dates").then((r) => {
      setDates(r.data);
      if (!day && r.data[0]) setDay(r.data[0]);
    });

  useEffect(() => {
    loadDates();
  }, []);

  useEffect(() => {
    if (!day) return;
    api.get(`/pos/transactions?date=${day}`).then((r) => setTxns(r.data));
  }, [day]);

  const upload = async () => {
    if (!file) return toast.error("Choose a CSV first");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/pos/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        `Imported ${r.data.imported} rows · ${r.data.quality_failures} quality flags`
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await loadDates();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="lss-overline">POS Import & Sync</div>
          <h1 className="font-serif-lux text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight mt-1">Bring in the Day's Sales</h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base mt-2 max-w-2xl">
            Upload the Geetanjali CSV export file. Columns are automatically parsed, staff & SKUs seeded, and full-discount services tagged for quality audit.
          </p>
        </div>
        <button
          onClick={handleResetPOS}
          disabled={busy}
          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
        >
          <Trash2 className="w-4.5 h-4.5" />
          Reset POS Data
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lss-card p-6 sm:p-8 max-w-4xl border-t-4 border-amber-500"
      >
        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          data-testid="upload-dropzone"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setFile(e.dataTransfer.files[0]);
            }
          }}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-6 cursor-pointer text-center transition-all ${
            isDragging ? "border-amber-500 bg-amber-100/80 scale-105" :
            file
              ? "border-amber-400 bg-amber-50/60"
              : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 hover:border-amber-400"
          }`}
        >
          <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl mb-4 shadow-xs">
            {file ? <FileSpreadsheet className="w-8 h-8 text-amber-800" /> : <UploadCloud className="w-8 h-8 text-amber-700" />}
          </div>
          
          <div className="text-lg font-extrabold text-slate-950">
            {file ? file.name : "Drop CSV file here or click to browse"}
          </div>

          <div className="text-xs text-slate-600 font-semibold mt-1 max-w-md">
            Expected headers: Date · Item Name · Net Price · Staff 1-4 · Discount columns
          </div>

          <input
            ref={inputRef}
            data-testid="upload-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
        </motion.label>

        <div className="flex justify-between items-center mt-6">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-seeds new staff and inventory items
          </div>
          <button
            data-testid="upload-submit"
            disabled={busy || !file}
            onClick={upload}
            className="lss-btn-gold px-8 py-3 uppercase tracking-wider text-xs font-extrabold disabled:opacity-50 shadow-md"
          >
            {busy ? "Processing Data…" : "Process & Sync POS Data"}
          </button>
        </div>
      </motion.div>

      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="lss-overline">Recent Transactions</div>
            <h2 className="font-serif-lux text-2xl font-bold text-slate-950 mt-1">Transaction Preview</h2>
          </div>
          <DatePicker
            value={day || new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>

        <div className="lss-card overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
          <table className="lss-table" data-testid="txns-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Item / Service</th>
                <th>Category</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Net Price</th>
                <th className="text-right">Value Card</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className={t.is_quality_failure ? "bg-rose-50/70 border-l-4 border-rose-500" : ""}>
                  <td className="font-extrabold text-slate-950 flex items-center gap-1.5">
                    {t.is_quality_failure && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    {t.invoice_number}
                  </td>
                  <td className="font-bold text-slate-900">{t.client_name}</td>
                  <td className="font-semibold text-slate-900">{t.item_name}</td>
                  <td>
                    <span className="lss-badge bg-slate-100 text-slate-900 border border-slate-300 font-extrabold">
                      {t.category}
                    </span>
                  </td>
                  <td className="text-right tabular font-medium text-slate-700">{money(t.rate)}</td>
                  <td className="text-right tabular font-bold text-amber-800">{money(t.total_discount)}</td>
                  <td className="text-right tabular font-extrabold text-slate-950">{money(t.net_price)}</td>
                  <td className="text-right tabular font-bold text-amber-900">{money(t.value_card_paid || t.other || 0)}</td>
                  <td className="text-xs text-slate-700 font-semibold">
                    {t.staff?.map((s) => s.name).join(", ")}
                  </td>
                </tr>
              ))}
              {txns.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 font-medium py-10">
                    No transactions found for {day || "selected date"}.
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
