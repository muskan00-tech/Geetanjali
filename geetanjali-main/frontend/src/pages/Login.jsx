import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import GeetanjaliLogo from "../components/GeetanjaliLogo";

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@luxurysalon.com");
  const [password, setPassword] = useState("owner123");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(u.role === "owner" ? "/owner" : "/manager");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGLoading(true);
    try {
      const u = await loginWithGoogle();
      toast.success(`Welcome back, ${u.name}`);
      nav(u.role === "owner" ? "/owner" : "/manager");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setGLoading(false);
    }
  };

  const quickFill = (which) => {
    if (which === "owner") {
      setEmail("owner@luxurysalon.com");
      setPassword("owner123");
    } else {
      setEmail("manager@luxurysalon.com");
      setPassword("manager123");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Left panel: Ultra-Luxury Obsidian & Champagne Gold Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <GeetanjaliLogo size="md" />
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 font-extrabold text-xs uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Luxury Salon Operations Suite
          </span>
          <h1 className="font-serif-lux text-4xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
            High-trust operations & <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">automated salon analytics.</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed font-medium">
            Real-time inventory intelligence, automated commission payouts, stock leakage detection, and POS reconciliation.
          </p>
        </div>

        <div className="relative z-10 text-xs font-semibold text-slate-400 flex justify-between items-center">
          <span>© Geetanjali Salon Operations Platform</span>
          <span className="text-amber-400/80 font-bold">PostgreSQL Engine Enabled</span>
        </div>
      </div>

      {/* Right panel: High-contrast sign-in form */}
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <GeetanjaliLogo size="md" />
          </div>

          <div className="lss-overline text-amber-800 mb-1">Sign In</div>
          <h2 className="font-serif-lux text-4xl font-bold text-slate-950 tracking-tight mb-2">Welcome Back</h2>
          <p className="text-sm font-medium text-slate-600 mb-8">Enter your credentials to access the operations workspace.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Email Address</label>
              <input
                data-testid="login-email"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">Password</label>
              <input
                data-testid="login-password"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full mt-8 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm tracking-wide rounded-xl transition-all shadow-md shadow-amber-500/20 border border-amber-300/40 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />}
            <span>{loading ? "Signing in..." : "Sign In to Platform"}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-slate-950" />}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={gLoading || loading}
            className="w-full mt-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-60"
          >
            {gLoading ? (
              <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{gLoading ? "Authenticating..." : "Sign in with Google"}</span>
          </button>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Quick Demo Login</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="quick-owner"
                onClick={() => quickFill("owner")}
                className="py-2.5 px-3 bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 font-extrabold text-xs rounded-xl transition-colors border border-amber-300/60 text-center shadow-xs"
              >
                Owner Demo
              </button>
              <button
                type="button"
                data-testid="quick-manager"
                onClick={() => quickFill("manager")}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-950 font-extrabold text-xs rounded-xl transition-colors border border-slate-300 text-center shadow-xs"
              >
                Manager Demo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
