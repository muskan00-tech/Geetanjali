import React, { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function DatePicker({
  value,
  onChange,
  label,
  type = "date", // 'date' | 'month'
  posDates = [],
  testId = "date-picker",
  className = "",
  id,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse date string (YYYY-MM-DD or YYYY-MM) into JS Date object
  const parseValue = (val) => {
    if (!val) return new Date();
    if (val.length === 7) return new Date(`${val}-01T00:00:00`);
    return new Date(`${val}T00:00:00`);
  };

  const activeDate = parseValue(value);
  const [viewYear, setViewYear] = useState(activeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(activeDate.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState(
    value || new Date().toISOString().slice(0, type === "month" ? 7 : 10)
  );

  useEffect(() => {
    if (value) {
      setSelectedDateStr(value);
      const d = parseValue(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const emitChange = (dateStr) => {
    if (onChange) {
      onChange({ target: { value: dateStr, name: id } });
    }
  };

  const handleSelectDay = (dayNum) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    const dateStr = `${viewYear}-${mm}-${dd}`;
    setSelectedDateStr(dateStr);
    emitChange(dateStr);
    setOpen(false);
  };

  const handleSelectMonth = (mIdx) => {
    const mm = String(mIdx + 1).padStart(2, "0");
    const monthStr = `${viewYear}-${mm}`;
    setSelectedDateStr(monthStr);
    emitChange(monthStr);
    setOpen(false);
  };

  const handleApply = () => {
    emitChange(selectedDateStr);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
          {label}
        </label>
      )}
      <div
        onClick={() => setOpen(!open)}
        className="relative flex items-center group cursor-pointer"
      >
        <CalendarIcon className="w-4 h-4 text-slate-700 absolute left-3 pointer-events-none transition-transform duration-200 group-hover:scale-110 z-10" />
        <input
          id={id}
          type="text"
          readOnly
          data-testid={testId}
          value={value || selectedDateStr}
          className="bg-white border border-slate-300 hover:border-slate-400 focus:border-slate-900 text-slate-900 text-sm font-semibold rounded-lg pl-9 pr-4 py-2 outline-none transition-all shadow-xs cursor-pointer select-none"
        />
      </div>

      {/* Modern Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-xl text-slate-900 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick POS Date Suggestions */}
          {posDates && posDates.length > 0 && (
            <div className="mb-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Available POS {type === "month" ? "Months" : "Dates"}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                {Array.from(new Set(posDates.map(d => type === "month" ? d.slice(0, 7) : d))).slice(0, 6).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setSelectedDateStr(d);
                      emitChange(d);
                      setOpen(false);
                    }}
                    className={`px-2 py-0.5 text-xs rounded border transition font-semibold ${
                      selectedDateStr === d
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month & Year Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-700 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-base tracking-tight flex gap-2 text-slate-900">
              <span>{monthNames[viewMonth]}</span>
              <span className="text-slate-900">{viewYear}</span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-700 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month View (if type === "month") */}
          {type === "month" ? (
            <div className="grid grid-cols-3 gap-2 my-2">
              {monthNames.map((mn, idx) => {
                const isSel =
                  viewYear === activeDate.getFullYear() && idx === activeDate.getMonth();
                return (
                  <button
                    key={mn}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2 text-xs rounded-md font-bold transition ${
                      isSel
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {mn}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {dayHeaders.map((dh) => (
                  <div key={dh}>{dh}</div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`prev-${i}`} className="py-1.5 text-slate-300">
                    {prevMonthDays - firstDayIndex + i + 1}
                  </div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const mm = String(viewMonth + 1).padStart(2, "0");
                  const dd = String(dayNum).padStart(2, "0");
                  const currStr = `${viewYear}-${mm}-${dd}`;
                  const isSelected = selectedDateStr === currStr;
                  const isPosDate = posDates.includes(currStr);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`relative py-1.5 rounded-full font-bold transition ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-xs"
                          : isPosDate
                          ? "bg-amber-100 text-amber-900 font-bold border border-amber-300 hover:bg-amber-200"
                          : "text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {dayNum}
                      {isPosDate && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Action Footer */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="lss-btn-outline px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="lss-btn-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-xs"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
