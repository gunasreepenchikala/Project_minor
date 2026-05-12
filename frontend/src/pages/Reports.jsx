import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Download, Trash2, FileText, RefreshCw } from "lucide-react";
import { Layout } from "../App.jsx";
import { API_BASE } from "../config.js";

function StatusBadge({ status }) {
  if (status === "Compliant") return <span className="badge badge-green"><CheckCircle2 size={11} /> Compliant</span>;
  if (status === "Partial") return <span className="badge badge-yellow"><AlertTriangle size={11} /> Partial</span>;
  return <span className="badge badge-red"><AlertCircle size={11} /> Non-Compliant</span>;
}
function RiskBadge({ risk }) {
  if (risk === "Low") return <span className="badge badge-outline-green">Low</span>;
  if (risk === "Medium") return <span className="badge badge-outline-yellow">Med</span>;
  return <span className="badge badge-outline-red">High</span>;
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const loadReports = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/api/compliance/reports`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((d) => {
        setReports(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this report?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/compliance/reports/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok || res.status === 204) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert("Failed to delete report. Please try again.");
    }
  };

  const downloadTxt = (r) => {
    const txt = `COMPLIANCE REPORT\n${"=".repeat(50)}\nDate: ${new Date(r.createdAt).toLocaleString()}\nQuery: ${r.query}\nStatus: ${r.status}\nRisk Level: ${r.riskLevel}\n\nEXPLANATION\n${r.explanation}\n\nRECOMMENDATIONS\n${r.recommendations}\n\nREGULATIONS FLAGGED\n${r.regulationsViolated}`;
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `report-${r.id}.txt`; a.click();
  };

  const filtered = reports.filter((r) => statusFilter === "all" || r.status === statusFilter).filter((r) => riskFilter === "all" || r.riskLevel === riskFilter);

  return (
    <Layout>
      <div className="page-title">Reports History</div>
      <div className="page-sub">All compliance analyses stored in your account.</div>
      <div className="filters">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option><option value="Compliant">Compliant</option><option value="Partial">Partial</option><option value="Non-Compliant">Non-Compliant</option>
        </select>
        <select className="filter-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="all">All Risk Levels</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
        </select>
      </div>
      {loading ? (
        <div className="empty"><p>Loading...</p></div>
      ) : error ? (
        <div className="empty">
          <p style={{ color: "#dc2626", marginBottom: 16 }}>Could not connect to the backend. Make sure <code>python app.py</code> is running on port 5000.</p>
          <button className="btn btn-outline" onClick={loadReports} style={{ margin: "0 auto" }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <FileText size={36} style={{ margin: "0 auto 12px" }} />
          <p>
            {reports.length === 0
              ? "No reports yet. Go to Analyzer to run your first check."
              : "No reports match the current filters."}
          </p>
        </div>
      ) : (
        <table className="reports-table">
          <thead><tr><th>Date</th><th>Query</th><th>Status</th><th>Risk</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: "nowrap", color: "#94a3b8", fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><div className="query-cell">"{r.query}"</div></td>
                <td><StatusBadge status={r.status} /></td>
                <td><RiskBadge risk={r.riskLevel} /></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => downloadTxt(r)}><Download size={13} /></button>
                    <button className="btn btn-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }} onClick={() => handleDelete(r.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
