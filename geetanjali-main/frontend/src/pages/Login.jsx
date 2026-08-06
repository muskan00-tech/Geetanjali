import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Login() {
  const { user, login, resetPassword } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address in the field above first.");
      return;
    }
    setResetting(true);
    try {
      await resetPassword(email);
      toast.success(`Password reset email sent to ${email}! Please check your inbox.`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setResetting(false);
    }
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
              disabled={resetting}
              onClick={handleForgotPassword}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
            >
              {resetting ? "Sending Email..." : "Forgot Password?"}
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
        </form>

        {/* Footer Note */}
        <p className="text-xs font-semibold text-slate-500 text-center mt-5">
          New to the Hub? Contact your Manager to create an account
        </p>
      </motion.div>
    </div>
  );
}
