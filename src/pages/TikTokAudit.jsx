import { callClaude, getApiKey } from "../utils/api.js";
import React, { useState } from "react";

const SYSTEM = `Tu es un expert TikTok et créateur de contenu. Tu analyses le profil TikTok d'un utilisateur et génères un audit complet avec un plan d'action personnalisé.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "score": 72,
  "score_label": "Bon potentiel",
  "strengths": ["point fort 1", "point fort 2"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "content_analysis": {
    "hook_quality": "moyen",
    "posting_frequency": "insuffisante",
    "engagement_rate": "3.2%",
    "best_content_type": "vidéos courtes 15-30s"
  },
  "action_plan": [
    { "priority": 1, "action": "action concrète", "why": "pourquoi", "impact": "haute", "time_to_implement": "immédiat" }
  ],
  "content_ideas": ["idée de contenu 1", "idée 2", "idée 3"],
  "optimal_posting_times": ["18h-20h", "12h-13h"],
  "hashtag_strategy": "description de la stratégie hashtags",
  "monetization_tips": ["conseil monétisation 1", "conseil 2"]
}`;

export default function TikTokAudit() {
  const [username, setUsername] = useState("");
  const [followers, setFollowers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [frequency, setFrequency] = useState("");
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getApiKey = () => {
    try { return JSON.parse(localStorage.getItem("clipforge-storage"))?.state?.apiKey; } catch { return null; }
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/claude/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": getApiKey(),  },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          system: SYSTEM,
          messages: [{ role: "user", content: `Profil TikTok : @${username}. Abonnés : ${followers || "inconnu"}. Vues moyennes : ${avgViews || "inconnu"}. Fréquence de publication : ${frequency || "inconnue"} vidéos/semaine. Niche : ${niche || "généraliste"}. Génère un audit complet et un plan d'action personnalisé.` }]
        })
      });
      const data = await res.json();
      setResult(JSON.parse(data.content?.[0]?.text.replace(/```json|```/g, "").trim() || "{}"));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const scoreColor = result ? (result.score >= 70 ? "#27500A" : result.score >= 40 ? "#633806" : "#712B13") : "#1A1A1A";
  const scoreBg = result ? (result.score >= 70 ? "#EAF3DE" : result.score >= 40 ? "#FAEEDA" : "#FAECE7") : "var(--bg3)";

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📱 Audit TikTok IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Analyse de ton compte TikTok avec un plan d'action personnalisé pour exploser ta croissance.</p>
      </div>

      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Nom d'utilisateur TikTok</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="@tonpseudo" />
          </div>
          <div>
            <label>Niche / Thématique</label>
            <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: Resell sneakers, Luxe, Finance..." />
          </div>
          <div>
            <label>Nombre d'abonnés</label>
            <input type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="Ex: 1500" />
          </div>
          <div>
            <label>Vues moyennes par vidéo</label>
            <input type="number" value={avgViews} onChange={e => setAvgViews(e.target.value)} placeholder="Ex: 500" />
          </div>
          <div>
            <label>Vidéos publiées par semaine</label>
            <input type="number" value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Ex: 3" />
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={analyze} disabled={loading || !username.trim()}>
          {loading ? "⏳ Analyse en cours..." : "🔍 Analyser mon TikTok"}
        </button>
      </div>

      {result && (
        <>
          {/* Score */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ background: scoreBg, borderRadius: 14, padding: "20px", textAlign: "center", minWidth: 100 }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: scoreColor }}>{result.score}</div>
              <div style={{ fontSize: 11, color: scoreColor }}>/100</div>
              <div style={{ fontSize: 12, color: scoreColor, marginTop: 4, fontWeight: 600 }}>{result.score_label}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="card card-sm">
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Points forts</div>
                {result.strengths?.map((s, i) => <div key={i} style={{ fontSize: 12, color: "#27500A" }}>✓ {s}</div>)}
              </div>
              <div className="card card-sm">
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Points à améliorer</div>
                {result.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: 12, color: "#712B13" }}>✗ {w}</div>)}
              </div>
            </div>
          </div>

          {/* Plan d'action */}
          <div className="card section">
            <div className="section-title">🎯 Plan d'action prioritaire</div>
            {result.action_plan?.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < result.action_plan.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 28, height: 28, background: "#1A1A1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>#{step.priority}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{step.action}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>{step.why}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, background: step.impact === "haute" ? "#EAF3DE" : "var(--bg3)", color: step.impact === "haute" ? "#27500A" : "var(--text2)", padding: "1px 6px", borderRadius: 8 }}>Impact {step.impact}</span>
                    <span style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text2)", padding: "1px 6px", borderRadius: 8 }}>{step.time_to_implement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2 section">
            {/* Idées de contenu */}
            <div className="card">
              <div className="section-title">💡 Idées de contenu</div>
              {result.content_ideas?.map((idea, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: i < result.content_ideas.length - 1 ? "1px solid var(--border)" : "none" }}>→ {idea}</div>)}
            </div>
            {/* Monétisation */}
            <div className="card">
              <div className="section-title">💰 Monétisation</div>
              {result.monetization_tips?.map((tip, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: i < result.monetization_tips.length - 1 ? "1px solid var(--border)" : "none" }}>💡 {tip}</div>)}
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text2)" }}>
                ⏰ Meilleurs horaires : {result.optimal_posting_times?.join(", ")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
