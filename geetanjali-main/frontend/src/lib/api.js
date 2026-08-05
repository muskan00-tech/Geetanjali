import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 60000,
});

// Attach bearer token on requests
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("lss_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Auto-retry once on network error / cold-start 50x
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config;
    if (!cfg || cfg._retry) return Promise.reject(err);
    if (!err.response || err.response.status >= 500) {
      cfg._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return api(cfg);
    }
    return Promise.reject(err);
  }
);

export default api;

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
    return "Server is warming up. Retrying automatically...";
  }
  if (!d) return e?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(", ");
  return JSON.stringify(d);
};
