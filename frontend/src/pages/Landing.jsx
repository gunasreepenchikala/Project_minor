import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../App.jsx";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (user) { navigate("/analyzer"); return null; }
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="landing-logo"><ShieldCheck size={32} /></div>
        <h1>ComplyAI</h1>
        <p>AI-powered compliance analysis for GDPR, data privacy laws, and AI ethics — instant risk assessment for your organization.</p>
        <div className="landing-btns">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/sign-up")}>Get Started</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate("/sign-in")}>Sign In</button>
        </div>
      </div>
    </div>
  );
}
