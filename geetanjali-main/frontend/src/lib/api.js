import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 25000, // 25s — fail fast, not 60s
});

// Attach bearer token — read once per request, no async overhead
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("lss_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Retry once on 5xx/network error with short delay (cold-start on Render)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config;
    if (!cfg || cfg._retry) return Promise.reject(err);
    if (!err.response || err.response.status >= 500) {
      cfg._retry = true;
      await new Promise((r) => setTimeout(r, 800)); // was 2500ms
      return api(cfg);
    }
    return Promise.reject(err);
  }
);

export default api;

// Kick a keep-alive ping to wake Render from cold-sleep on app start
let _pinged = false;
export function pingBackend() {
  if (_pinged) return;
  _pinged = true;
  fetch(`${API}/health`, { method: "GET" }).catch(() => {});
}

export const money = (n) => {
  if (n == null || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

export const moneyFull = (n) => {
  if (n == null || isNaN(n)) return "₹0.00";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (e?.code === "ECONNABORTED" || e?.message?.includes("timeout")) {
    return "Server is warming up, retrying...";
  }
  if (!d) return e?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(", ");
  return JSON.stringify(d);
};
