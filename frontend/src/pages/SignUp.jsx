import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../App.jsx";

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try { await signUp(email, password); navigate("/analyzer"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><div className="logo"><ShieldCheck size={22} /></div><span>ComplyAI</span></div>
        <h2>Create your account</h2>
        <p className="subtitle">Start analyzing compliance today</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required /></div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>
        <div className="auth-link">Already have an account? <Link to="/sign-in">Sign in</Link></div>
      </div>
    </div>
  );
}
