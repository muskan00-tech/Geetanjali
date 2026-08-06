import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../lib/api";
import { Loader2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050507] text-slate-100 relative overflow-hidden font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Ambient Backlight Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Main NOIR Luxury Card Frame */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm sm:max-w-md bg-[#0c0c0e]/90 backdrop-blur-3xl border border-[#33271b]/80 shadow-[0_30px_100px_rgba(0,0,0,0.95)] rounded-3xl p-7 sm:p-9 relative overflow-hidden flex flex-col items-center"
      >
        {/* Top Metallic Accent Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-90"></div>

        {/* Brand Header */}
        <div className="text-center pt-2 pb-4 z-10 flex flex-col items-center">
          <h1 className="font-serif-lux text-3xl sm:text-4xl font-bold tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-[#fceabb] via-[#f8b500] to-[#b8860b] drop-shadow-sm uppercase">
            GEETANJALI
          </h1>
          <span className="text-[11px] font-extrabold tracking-[0.35em] text-[#d4af37]/80 uppercase mt-1">
            SALON & SUITE
          </span>
        </div>

        {/* Hero Hair Artwork with Soft Radial Vignette */}
        <div className="relative w-full h-44 sm:h-52 my-1 flex items-center justify-center overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0e] via-transparent to-[#0c0c0e] z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0e] via-transparent to-[#0c0c0e] z-10 pointer-events-none"></div>
          <img
            src="/assets/noir_salon_hair.png"
            alt="Geetanjali Luxury Hair"
            className="w-full h-full object-cover object-center scale-105 filter contrast-[1.08] brightness-[0.95] rounded-2xl"
          />
        </div>

        {/* Sign In Form */}
        <form onSubmit={submit} data-testid="login-form" className="w-full space-y-4 pt-2 z-20">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9a8264]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-11 pr-4 py-3.5 bg-[#141418]/90 border border-[#382f25] focus:border-[#d4af37] text-white placeholder-[#857463] text-sm rounded-xl outline-none transition-all shadow-inner focus:ring-1 focus:ring-[#d4af37]/40"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#9a8264]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                data-testid="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-11 py-3.5 bg-[#141418]/90 border border-[#382f25] focus:border-[#d4af37] text-white placeholder-[#857463] text-sm rounded-xl outline-none transition-all shadow-inner focus:ring-1 focus:ring-[#d4af37]/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9a8264] hover:text-[#d4af37] transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Golden SIGN IN Button */}
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#c69a3a] via-[#f7eaad] to-[#a47622] hover:brightness-110 active:scale-[0.99] text-[#0d0b07] font-black text-sm tracking-[0.18em] rounded-xl transition-all shadow-[0_4px_25px_rgba(212,175,55,0.25)] border border-[#fceabb]/40 uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />}
            <span>{loading ? "AUTHENTICATING..." : "SIGN IN"}</span>
          </button>
        </form>

        {/* Forgot Password / Footer Links */}
        <div className="w-full text-center mt-5 space-y-4">
          <button
            type="button"
            onClick={() => toast.info("Please contact the System Administrator to reset your password.")}
            className="text-xs font-medium text-[#a39077] hover:text-[#d4af37] transition cursor-pointer"
          >
            Forgot Password?
          </button>

          <div className="pt-2 border-t border-[#261f17]/80 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#806f5c]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Geetanjali Salon: Enterprise Operations</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
