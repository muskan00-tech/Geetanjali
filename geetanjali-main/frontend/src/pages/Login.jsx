import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

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

  const handleSocialClick = (provider) => {
    toast.info(`${provider} login is managed via your Enterprise SSO account.`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#F5EFEB] text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Centered White Luxury Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-slate-200/80 shadow-2xl shadow-slate-300/40 rounded-3xl p-8 sm:p-10 flex flex-col items-center relative overflow-hidden"
      >
        {/* Top Gold Emblem & Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 mb-2 flex items-center justify-center">
            <img
              src="/geetanjali-emblem-badge.png"
              alt="Geetanjali Lotus Emblem"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <h2 className="font-serif-lux text-xl font-bold tracking-[0.25em] text-[#B8860B] uppercase">
            GEETANJALI
          </h2>
          <span className="text-[10px] font-extrabold tracking-[0.3em] text-slate-700 uppercase -mt-0.5">
            SALON
          </span>

          <h1 className="font-serif-lux text-2xl sm:text-3xl font-bold text-slate-900 mt-5 leading-tight">
            Welcome Back to the Geetanjali Salon Hub!
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} data-testid="login-form" className="w-full space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address or Username"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 focus:border-[#C69A3A] text-slate-800 placeholder:text-slate-400 text-sm rounded-xl outline-none transition shadow-xs focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                data-testid="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 focus:border-[#C69A3A] text-slate-800 placeholder:text-slate-400 text-sm rounded-xl outline-none transition shadow-xs focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#C69A3A] focus:ring-amber-500/20"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => toast.info("Contact Administrator to reset password.")}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Golden LOG IN Button */}
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#D8AB4E] via-[#C69A3A] to-[#B38527] hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-sm tracking-wider rounded-xl transition shadow-md shadow-amber-500/20 uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 text-white animate-spin" />}
            <span>{loading ? "LOGGING IN..." : "LOG IN"}</span>
          </button>

          {/* OR Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
              OR
            </span>
          </div>

          {/* Social Logins */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleSocialClick("Google")}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialClick("Apple")}
              className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.68-.82 1.14-1.97 1.01-3.09-1 .04-2.17.67-2.85 1.47-.61.71-1.14 1.88-1 3 1.11.09 2.16-.56 2.84-1.38z"/>
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-xs font-semibold text-slate-500 text-center mt-5">
          New to the Hub? Contact your Manager to create an account
        </p>
      </motion.div>
    </div>
  );
}
