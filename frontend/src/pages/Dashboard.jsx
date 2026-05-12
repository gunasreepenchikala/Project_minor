import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, BarChart2, RefreshCw } from "lucide-react";
import { Layout } from "../App.jsx";
import { API_BASE } from "../config.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/api/compliance/stats`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const pct = (v) => stats?.total ? Math.round((v / stats.total) * 100) : 0;

  return (
    <Layout>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Overview of your compliance analysis history.</div>

      {loading ? (
        <div className="empty"><p>Loading...</p></div>
      ) : error ? (
        <div className="empty">
          <p style={{ color: "#dc2626", marginBottom: 16 }}>Could not connect to the backend. Make sure <code>python app.py</code> is running on port 5000.</p>
          <button className="btn btn-outline" onClick={loadStats} style={{ margin: "0 auto" }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : stats?.total === 0 ? (
        <div className="empty">
          <BarChart2 size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p>No analyses yet. Go to the <strong>Analyzer</strong> tab to run your first compliance check.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="label">Total</div><div className="value">{stats.total}</div><div className="desc">All analyses</div></div>
            <div className="stat-card"><div className="label" style={{ color: "#059669" }}>Compliant</div><div className="value" style={{ color: "#059669" }}>{stats.compliant}</div><div className="desc">{pct(stats.compliant)}% of total</div></div>
            <div className="stat-card"><div className="label" style={{ color: "#d97706" }}>Partial</div><div className="value" style={{ color: "#d97706" }}>{stats.partial}</div><div className="desc">Need attention</div></div>
            <div className="stat-card"><div className="label" style={{ color: "#dc2626" }}>Non-Compliant</div><div className="value" style={{ color: "#dc2626" }}>{stats.nonCompliant}</div><div className="desc">Action required</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><BarChart2 size={16} style={{ color: "#1d4ed8" }} /> Status Breakdown</h3></div>
              <div className="card-body">
                {[{label:"Compliant",v:stats.compliant,c:"#10b981",I:ShieldCheck},{label:"Partial",v:stats.partial,c:"#f59e0b",I:AlertTriangle},{label:"Non-Compliant",v:stats.nonCompliant,c:"#ef4444",I:AlertCircle}].map(({label,v,c,I}) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13 }}>
                      <span style={{ display:"flex",alignItems:"center",gap:6,fontWeight:500 }}><I size={13} style={{ color:c }} />{label}</span>
                      <span style={{ color:"#64748b" }}>{v} ({pct(v)}%)</span>
                    </div>
                    <div style={{ height:8,background:"#f1f5f9",borderRadius:100 }}><div style={{ height:"100%",width:`${pct(v)}%`,background:c,borderRadius:100,transition:"width .5s" }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Risk Breakdown</h3></div>
              <div className="card-body">
                {[{label:"High Risk",v:stats.highRisk,c:"#ef4444"},{label:"Medium Risk",v:stats.mediumRisk,c:"#f59e0b"},{label:"Low Risk",v:stats.lowRisk,c:"#10b981"}].map(({label,v,c}) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13 }}><span style={{ fontWeight:500 }}>{label}</span><span style={{ color:"#64748b" }}>{v} ({pct(v)}%)</span></div>
                    <div style={{ height:8,background:"#f1f5f9",borderRadius:100 }}><div style={{ height:"100%",width:`${pct(v)}%`,background:c,borderRadius:100,transition:"width .5s" }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
