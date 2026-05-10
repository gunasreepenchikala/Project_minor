import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { Layout } from "../App.jsx";
import { API_BASE } from "../config.js";

const SAMPLES = [
  "We store user emails without consent",
  "We encrypt all user data",
  "Collecting data with unclear purpose",
  "Users can delete their data anytime",
  "Passwords are stored in plain text",
  "Privacy policy is hard to understand",
];

function StatusBadge({ status }) {
  if (status === "Compliant") return <span className="badge badge-green"><CheckCircle2 size={11} /> Compliant</span>;
  if (status === "Partial") return <span className="badge badge-yellow"><AlertTriangle size={11} /> Partial</span>;
  return <span className="badge badge-red"><AlertCircle size={11} /> Non-Compliant</span>;
}

function RiskBadge({ risk }) {
  if (risk === "Low") return <span className="badge badge-outline-green">Low Risk</span>;
  if (risk === "Medium") return <span className="badge badge-outline-yellow">Medium Risk</span>;
  return <span className="badge badge-outline-red">High Risk</span>;
}

export default function Analyzer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState([]);

  const loadRecent = () => {
    fetch(`${API_BASE}/api/compliance/reports`, { credentials: "include" })
      .then((r) => r.json()).then((d) => setRecent(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  };
  useEffect(() => { loadRecent(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim().length < 10) { setError("Please provide more detail (at least 10 characters)."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/compliance/analyze`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Analysis failed");
      setResult(data); setQuery(""); loadRecent();
    } catch (err) { setError(err.message || "Analysis failed. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="page-title">Compliance Analyzer</div>
      <div className="page-sub">Evaluate your data practices against GDPR, AI ethics, and global privacy standards.</div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck size={17} style={{ color: "#1d4ed8" }} /> New Analysis</h3>
          <p>Describe your data practice or policy for immediate evaluation.</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Describe your data practice or ask a compliance question..." style={{ marginBottom: 12 }} />
            <div className="chips">
              <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center", marginRight: 4 }}>Try:</span>
              {SAMPLES.map((s, i) => <span key={i} className="chip" onClick={() => setQuery(s)}>{s}</span>)}
            </div>
            {error && <div className="error-msg" style={{ textAlign: "left", marginTop: 10 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Analyzing...</> : <>Analyze <ArrowRight size={15} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Evaluated</div>
              <div className="result-query">"{result.query}"</div>
            </div>
            <div className="result-badges"><RiskBadge risk={result.riskLevel} /><StatusBadge status={result.status} /></div>
          </div>
          <div className="result-body">
            <div className="result-col">
              <h4><ShieldCheck size={14} style={{ color: "#1d4ed8" }} /> Explanation</h4>
              <p>{result.explanation}</p>
              {result.regulationsViolated && result.regulationsViolated !== "None" && (
                <><h4 style={{ marginTop: 16, color: "#dc2626" }}><AlertCircle size={14} /> Regulations Flagged</h4><div className="reg-box">{result.regulationsViolated}</div></>
              )}
            </div>
            <div className="result-col">
              <h4>Recommendations</h4>
              <ul className="rec-list">
                {result.recommendations.split("\u2022").filter((r) => r.trim()).map((rec, i) => (
                  <li key={i}><span className="rec-dot" /><span>{rec.trim()}</span></li>
                ))}
                {!result.recommendations.includes("\u2022") && <li><span className="rec-dot" /><span>{result.recommendations}</span></li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><Clock size={16} /> Recent Queries</h3>
          {recent.map((r) => (
            <div key={r.id} className="card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 10 }} onClick={() => setResult(r)}>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 400 }}>"{r.query}"</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
