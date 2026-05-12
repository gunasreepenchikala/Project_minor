import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../App.jsx";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await signIn(email, password); navigate("/analyzer"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><div className="logo"><ShieldCheck size={22} /></div><span>ComplyAI</span></div>
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to your account to continue</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required /></div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>
        <div className="auth-link">Don't have an account? <Link to="/sign-up">Sign up</Link></div>
      </div>
    </div>
  );
}
