import React, { createContext, useContext, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Clock, LogOut } from "lucide-react";
import { API_BASE } from "./config.js";
import Landing from "./pages/Landing.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Analyzer from "./pages/Analyzer.jsx";
import Reports from "./pages/Reports.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u || null))
      .catch(() => setUser(null));
  }, []);

  const signIn = async (email, password) => {
    const r = await fetch(`${API_BASE}/api/auth/signin`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Sign in failed");
    setUser(data);
    return data;
  };

  const signUp = async (email, password) => {
    const r = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Sign up failed");
    setUser(data);
    return data;
  };

  const signOut = async () => {
    await fetch(`${API_BASE}/api/auth/signout`, { method: "POST", credentials: "include" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Loading...</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  return children;
}

export function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { href: "/analyzer", label: "Analyzer", icon: ShieldCheck },
    { href: "/reports", label: "Reports", icon: Clock },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo"><ShieldCheck size={18} /></div>
          <span>ComplyAI</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} className={`nav-item ${location.pathname === item.href ? "active" : ""}`}>
              <item.icon size={16} />{item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="sidebar-user">
            <div className="user-info">
              <div className="user-avatar">{user.email?.[0]?.toUpperCase()}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <button className="btn-signout" onClick={handleSignOut} title="Sign Out"><LogOut size={16} /></button>
          </div>
        )}
      </aside>
      <main className="main-content">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/analyzer" element={<RequireAuth><Analyzer /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
