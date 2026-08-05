import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import OwnerDashboard from "@/pages/OwnerDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import POSUpload from "@/pages/POSUpload";
import Incentives from "@/pages/Incentives";
import InventoryHub from "@/pages/InventoryHub";
import Quality from "@/pages/Quality";
import Config from "@/pages/Config";
import Attendance from "@/pages/Attendance";
import SalesAnalytics from "@/pages/SalesAnalytics";
import StockAudit from "@/pages/StockAudit";
import COGS from "@/pages/COGS";
import Budgets from "@/pages/Budgets";
import Procurement from "@/pages/Procurement";
import VendorMatrix from "@/pages/VendorMatrix";

import { Toaster } from "@/components/ui/sonner";

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="h-screen flex items-center justify-center premium-bg text-slate-700 font-medium">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user === null) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "owner") return <Navigate to="/owner" replace />;
  return <Navigate to="/manager" replace />;
}

function App() {
  return (
    <div className="App min-h-screen premium-bg text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <Protected>
                  <HomeRedirect />
                </Protected>
              }
            />
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/analytics" element={<SalesAnalytics />} />
              <Route path="/pos" element={<POSUpload />} />
              <Route path="/incentives" element={<Incentives />} />
              <Route path="/inventory" element={<InventoryHub />} />
              <Route path="/audit" element={<StockAudit />} />
              <Route path="/cogs" element={<COGS />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/procurement" element={<Procurement />} />
              <Route path="/vendors" element={<VendorMatrix />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/config" element={<Config />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster theme="light" position="top-right" />
      </AuthProvider>
    </div>
  );
}

export default App;
