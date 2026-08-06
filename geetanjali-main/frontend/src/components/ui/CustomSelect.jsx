import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export default function CustomSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option...",
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => {
    const optVal = opt && typeof opt === "object" && opt.value !== undefined ? opt.value : opt;
    return String(optVal) === String(value);
  });

  const getOptionLabel = (opt) => {
    if (opt && typeof opt === "object") {
      return opt.label;
    }
    return opt;
  };

  const getOptionValue = (opt) => {
    if (opt && typeof opt === "object" && opt.value !== undefined) {
      return opt.value;
    }
    return opt;
  };

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 120),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = () => {
        updateCoords();
      };
      window.addEventListener("scroll", handleScroll, true);
      document.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        document.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest(".custom-select-portal")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    const val = getOptionValue(opt);
    onChange?.(val);
    setIsOpen(false);
  };

  const displayLabel = selectedOption ? getOptionLabel(selectedOption) : placeholder;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition cursor-pointer select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="custom-select-portal fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden font-sans"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              minWidth: "120px",
            }}
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              {options.map((opt, i) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const isSelected = String(optVal) === String(value);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 text-amber-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
