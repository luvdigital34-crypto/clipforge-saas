import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert en relation client e-commerce. Tu réponds aux avis clients de façon professionnelle et humaine.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "sentiment": "positif" ou "neutre" ou "négatif",
  "urgency": "faible" ou "moyenne" ou "haute",
  "urgency_reason": "pourquoi ce niveau d'urgence",
  "responses": [
    { "style": "Professionnel", "text": "réponse" },
    { "style": "Chaleureux", "text": "réponse" }
  ],
  "internal_action": "action interne recommandée (remboursement, geste commercial, rien...)"
}`;

export default function ReviewManager() {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState("3");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(-1);

  const analyze = async () => {
    if (!review.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Avis client (${rating}/5 étoiles) : "${review}". Analyse le sentiment, l'urgence, et génère 2 réponses adaptées.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
      });
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const copy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(-1), 2000);
  };

  const SENT = { positif: { color: "#4ADE80", bg: "#0F2A1A" }, neutre: { color: "#FCD34D", bg: "#2A1F0A" }, "négatif": { color: "#F87171", bg: "#2A0F0F" } };
  const URG = { faible: "#4ADE80", moyenne: "#FCD34D", haute: "#F87171" };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>⭐ Gestion des avis IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Colle un avis client, l'IA détecte l'urgence et génère des réponses pro.</p>
      </div>

      <div className="card section">
        <div style={{ marginBottom: 12 }}>
          <label>Avis client</label>
          <textarea rows={3} value={review} onChange={e => setReview(e.target.value)} placeholder="Colle l'avis du client ici..." />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Note donnée</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["1", "2", "3", "4", "5"].map(r => (
              <button key={r} onClick={() => setRating(r)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${rating === r ? "#3B82F6" : "var(--border)"}`, background: rating === r ? "#1E2A4A" : "#111118", color: rating === r ? "#60A5FA" : "var(--text2)", fontSize: 13, cursor: "pointer" }}>{r} ⭐</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={analyze} disabled={loading || !review.trim()}>
          {loading ? "⏳ Analyse..." : "⭐ Analyser & répondre"}
        </button>
      </div>

      {result && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ background: SENT[result.sentiment]?.bg, borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: SENT[result.sentiment]?.color }}>Sentiment : {result.sentiment}</div>
            </div>
            <div style={{ background: "#111118", border: `1px solid ${URG[result.urgency]}`, borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: URG[result.urgency] }}>Urgence : {result.urgency}</div>
            </div>
          </div>

          {result.urgency === "haute" && (
            <div className="card section" style={{ background: "#2A0F0F", borderColor: "#5A1A1A" }}>
              <div style={{ fontWeight: 700, color: "#F87171", marginBottom: 4 }}>🚨 Action urgente requise</div>
              <div style={{ fontSize: 13, color: "#F0A0A0" }}>{result.urgency_reason}</div>
            </div>
          )}

          {result.responses?.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#60A5FA" }}>{r.style}</span>
                <button className="btn btn-sm" onClick={() => copy(r.text, i)}>{copied === i ? "✓" : "📋"}</button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, background: "#0A0A0F", borderRadius: 8, padding: "10px 14px" }}>{r.text}</div>
            </div>
          ))}

          <div className="card" style={{ background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 4 }}>🛠 Action interne recommandée</div>
            <div style={{ fontSize: 13, color: "#B0C4E8" }}>{result.internal_action}</div>
          </div>
        </>
      )}
    </div>
  );
}
