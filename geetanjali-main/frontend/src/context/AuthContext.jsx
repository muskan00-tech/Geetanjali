import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged
} from "../lib/firebase";
import { pingBackend } from "../lib/api";

const AuthContext = createContext(null);

// Resolve user from localStorage instantly — no async wait on page load
function getUserFromStorage() {
  const token = localStorage.getItem("lss_token");
  const cached = localStorage.getItem("lss_user");
  if (token && cached) {
    try { return JSON.parse(cached); } catch { return null; }
  }
  return null;
}

export function AuthProvider({ children }) {
  // Start with cached user immediately to avoid loading flicker
  const [user, setUser] = useState(() => getUserFromStorage());
  const tokenRefreshTimer = useRef(null);

  const formatUser = async (fbUser, forceRefresh = false) => {
    if (!fbUser) return false;
    // Only call getIdToken when needed (avoid network on every render)
    const token = await fbUser.getIdToken(forceRefresh);
    localStorage.setItem("lss_token", token);
    const isOwner = fbUser.email?.toLowerCase().includes("owner");
    const userData = {
      id: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || (isOwner ? "Salon Owner" : "Salon Manager"),
      role: isOwner ? "owner" : "manager",
      token,
    };
    localStorage.setItem("lss_user", JSON.stringify(userData));
    return userData;
  };

  useEffect(() => {
    // Ping backend immediately to wake Render from cold sleep
    pingBackend();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userData = await formatUser(fbUser);
        setUser(userData);

        // Auto-refresh Firebase token every 55 minutes (tokens expire at 60min)
        if (tokenRefreshTimer.current) clearInterval(tokenRefreshTimer.current);
        tokenRefreshTimer.current = setInterval(async () => {
          try {
            const refreshed = await fbUser.getIdToken(true);
            localStorage.setItem("lss_token", refreshed);
            setUser((prev) => prev ? { ...prev, token: refreshed } : prev);
          } catch { /* ignore */ }
        }, 55 * 60 * 1000);
      } else {
        localStorage.removeItem("lss_token");
        localStorage.removeItem("lss_user");
        setUser(false);
        if (tokenRefreshTimer.current) clearInterval(tokenRefreshTimer.current);
      }
    });

    return () => {
      unsubscribe();
      if (tokenRefreshTimer.current) clearInterval(tokenRefreshTimer.current);
    };
  }, []);

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userData = await formatUser(res.user);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    localStorage.removeItem("lss_token");
    localStorage.removeItem("lss_user");
    if (tokenRefreshTimer.current) clearInterval(tokenRefreshTimer.current);
    try { await firebaseSignOut(auth); } catch { }
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
