import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, firebaseSignOut } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=user

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("lss_token");
    if (!token) {
      setUser(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => mounted && setUser(r.data))
      .catch(() => {
        if (mounted) {
          localStorage.removeItem("lss_token");
          setUser(false);
        }
      });
    return () => (mounted = false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (data.token) localStorage.setItem("lss_token", data.token);
      setUser(data);
      return data;
    } catch (err) {
      try {
        const fbRes = await signInWithEmailAndPassword(auth, email, password);
        const token = await fbRes.user.getIdToken();
        const userData = {
          id: fbRes.user.uid,
          email: fbRes.user.email,
          name: fbRes.user.displayName || fbRes.user.email.split("@")[0],
          role: "owner",
          token: token,
        };
        localStorage.setItem("lss_token", token);
        setUser(userData);
        return userData;
      } catch (fbErr) {
        throw err;
      }
    }
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const token = await res.user.getIdToken();
    const userData = {
      id: res.user.uid,
      email: res.user.email,
      name: res.user.displayName || res.user.email.split("@")[0],
      role: "owner",
      token: token,
    };
    localStorage.setItem("lss_token", token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    try {
      await firebaseSignOut(auth);
    } catch {}
    localStorage.removeItem("lss_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
