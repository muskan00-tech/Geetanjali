import { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  firebaseSignOut,
  onAuthStateChanged 
} from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=user

  const formatUser = async (fbUser) => {
    if (!fbUser) return false;
    const token = await fbUser.getIdToken();
    localStorage.setItem("lss_token", token);
    const isOwner = fbUser.email?.toLowerCase().includes("owner");
    return {
      id: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || (isOwner ? "Salon Owner" : "Salon Manager"),
      role: isOwner ? "owner" : "manager",
      token: token
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userData = await formatUser(fbUser);
        setUser(userData);
      } else {
        localStorage.removeItem("lss_token");
        setUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userData = await formatUser(res.user);
    setUser(userData);
    return userData;
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const userData = await formatUser(res.user);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    localStorage.removeItem("lss_token");
    try {
      await firebaseSignOut(auth);
    } catch {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
