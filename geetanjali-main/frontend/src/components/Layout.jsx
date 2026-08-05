import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import GeetanjaliLogo from "./GeetanjaliLogo";
import {
  LayoutDashboard,
  Upload,
  Coins,
  BadgeCheck,
  Boxes,
  ShieldAlert,
  Settings,
  LogOut,
  UserCheck,
  TrendingUp,
  ClipboardCheck,
  FlaskConical,
  Calculator,
  ShoppingCart,
  Building2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const navCategories = [
  {
    id: "dashboards",
    title: "Executive & Analytics",
    icon: LayoutDashboard,
    items: [
      { to: "/owner", label: "Owner MIS", icon: LayoutDashboard, roles: ["owner", "admin"] },
      { to: "/manager", label: "Manager Deck", icon: LayoutDashboard, roles: ["manager", "owner", "admin"] },
      { to: "/analytics", label: "Sales Analytics", icon: TrendingUp, roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    id: "pos_incentives",
    title: "POS & Incentive Engine",
    icon: Coins,
    items: [
      { to: "/pos", label: "POS Import", icon: Upload, roles: ["owner", "manager", "admin"] },
      { to: "/incentives", label: "Incentives Engine", icon: Coins, roles: ["owner", "manager", "admin"] },
      { to: "/attendance", label: "Staff & Attendance", icon: UserCheck, roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Operations",
    icon: Boxes,
    items: [
      { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["owner", "manager", "admin"] },
      { to: "/audit", label: "Stock Audit", icon: ClipboardCheck, roles: ["owner", "manager", "admin"] },
      { to: "/cogs", label: "COGS & Recipes", icon: FlaskConical, roles: ["owner", "manager", "admin"] },
      { to: "/budgets", label: "Inventory Budgets", icon: Calculator, roles: ["owner", "admin"] },
      { to: "/quality", label: "Quality Control", icon: ShieldAlert, roles: ["owner", "manager", "admin"] },
    ],
  },
  {
    id: "procurement",
    title: "Procurement & Suppliers",
    icon: ShoppingCart,
    items: [
      { to: "/procurement", label: "Procurement POs", icon: ShoppingCart, roles: ["owner", "manager", "admin"] },
      { to: "/vendors", label: "Vendor Matrix", icon: Building2, roles: ["owner", "admin"] },
    ],
  },
  {
    id: "settings",
    title: "System Config",
    icon: Settings,
    items: [
      { to: "/config", label: "Master Config", icon: Settings, roles: ["owner", "admin"] },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = () => {
    if (isPinned) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 150); // 150ms hover delay
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setIsHovered(false);
  };

  // Initialize category expansion state (auto-expand category containing current pathname)
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = { dashboards: true, pos_incentives: true, inventory: true, procurement: true, settings: true };
    navCategories.forEach((cat) => {
      if (cat.items.some((it) => it.to === location.pathname)) {
        initial[cat.id] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    // Auto expand active category when location changes
    navCategories.forEach((cat) => {
      if (cat.items.some((it) => it.to === location.pathname)) {
        setOpenCategories((prev) => ({ ...prev, [cat.id]: true }));
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleCategory = (catId) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen premium-bg text-slate-950 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Mobile Top Navbar with Hamburger Toggle */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <GeetanjaliLogo size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6 text-slate-950" /> : <Menu className="w-6 h-6 text-slate-950" />}
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar (Fixed/Sticky on Desktop, Hover-expanding / Pin-toggle, Slide-over Drawer on Mobile) */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed inset-y-0 left-0 z-50 h-full bg-white/25 backdrop-blur-2xl border-r border-[#E6DACD] flex flex-col transition-[width,transform] duration-200 ease-in-out shadow-xl lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? "w-64 translate-x-0" : `-translate-x-full lg:translate-x-0 ${isPinned || isHovered ? "lg:w-64" : "lg:w-20"}`
        }`}
      >
        {/* Middle-Right Pin Toggle Arrow Button */}
        <button
          type="button"
          onClick={() => {
            if (isPinned) {
              setIsPinned(false);
              setIsHovered(false);
            } else {
              setIsPinned(true);
              setIsHovered(true);
            }
          }}
          title={isPinned ? "Unpin sidebar (auto-collapse)" : "Pin sidebar open"}
          className="hidden lg:flex absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 bg-white border border-[#E6DACD] rounded-full shadow-md items-center justify-center text-slate-700 hover:text-slate-950 hover:scale-110 hover:border-amber-400 transition-all z-50 cursor-pointer"
        >
          {isPinned ? (
            <ChevronLeft className="w-4 h-4 text-amber-800" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Header Logo */}
        <div className={`py-5 border-b border-[#E6DACD] flex items-center shrink-0 bg-transparent transition-[padding,justify-content] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isPinned || isHovered || mobileOpen ? "px-5 justify-between" : "px-3 justify-center"
        }`}>
          <GeetanjaliLogo size="md" collapsed={!isPinned && !isHovered && !mobileOpen} />
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-slate-600 hover:text-slate-950"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Body */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-3 min-h-0 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isPinned || isHovered || mobileOpen ? (
              /* Expanded Full Menu */
              <motion.div
                key="expanded-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-3"
              >
                {navCategories.map((cat) => {
              const allowedItems = cat.items.filter(
                (it) => !user?.role || it.roles.includes(user.role)
              );
              if (allowedItems.length === 0) return null;

              const isExpanded = !!openCategories[cat.id];
              const hasActiveSub = allowedItems.some((it) => it.to === location.pathname);

              return (
                <div key={cat.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider rounded-lg transition-colors group cursor-pointer ${
                      hasActiveSub ? "text-amber-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <cat.icon className={`w-3.5 h-3.5 shrink-0 ${hasActiveSub ? "text-amber-700" : "text-slate-400 group-hover:text-slate-600"}`} />
                      <span className="truncate">{cat.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {allowedItems.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Sub Links */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="overflow-hidden space-y-1 pl-1"
                      >
                        {allowedItems.map((it) => (
                          <NavLink
                            key={it.to}
                            to={it.to}
                            onClick={() => setMobileOpen(false)}
                            data-testid={`nav-${it.to.replace("/", "")}`}
                            className={({ isActive }) =>
                              `relative flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-all ${
                                isActive
                                  ? "bg-slate-950 text-amber-300 font-extrabold border-l-4 border-amber-400 shadow-md shadow-slate-950/20"
                                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 font-semibold"
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <it.icon className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                                <span className="truncate">{it.label}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* Collapsed Mini Icons Bar */
          <motion.div
            key="collapsed-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-2.5 flex flex-col items-center"
          >
            {navCategories.flatMap(cat => cat.items).filter(it => !user?.role || it.roles.includes(user.role)).map((it) => {
              const isActive = location.pathname === it.to;
              return (
                <div key={it.to} className="relative group/tooltip">
                  <NavLink
                    to={it.to}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-slate-950 text-amber-300 border-l-4 border-amber-400 shadow-md shadow-slate-950/25 scale-105"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <it.icon className={`w-5 h-5 ${isActive ? "text-amber-400" : ""}`} />
                  </NavLink>

                  {/* Floating Tooltip Label Badge */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/tooltip:flex items-center z-50 pointer-events-none">
                    <div className="bg-slate-950 text-amber-300 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xl border border-amber-400/40 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                      {it.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

        {/* Footer User Info / Sign Out */}
        <div className={`border-t border-[#E6DACD] bg-white/20 shrink-0 transition-all ${
          isPinned || isHovered || mobileOpen ? "p-4" : "p-2 flex flex-col items-center justify-center"
        }`}>
          {isPinned || isHovered || mobileOpen ? (
            <>
              <div className="text-xs text-slate-600 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-slate-950 font-extrabold text-sm leading-snug">{user?.name || "Salon Owner"}</div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mt-0.5">{user?.role || "OWNER"}</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs"></span>
              </div>
              <button
                data-testid="logout-btn"
                onClick={doLogout}
                className="w-full py-2.5 px-3 text-xs font-bold text-slate-950 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <button
              data-testid="logout-btn"
              onClick={doLogout}
              title="Sign out"
              className="w-10 h-10 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Outlet with Framer Motion Page Fade & Slide Transition */}
      <main className="flex-1 min-w-0 overflow-x-hidden bg-transparent relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
