import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un vendeur expérimenté sur Vinted/Vestiaire/eBay qui répond aux messages clients. Tu réponds comme un humain : naturel, sympa, jamais robotique. Tu défends tes prix intelligemment sans braquer l'acheteur.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "understood": true,
  "intent": "négociation" ou "question dispo" ou "question produit" ou "demande lot" ou "autre",
  "responses": [
    { "style": "Ferme mais sympa", "text": "réponse complète" },
    { "style": "Contre-offre", "text": "réponse avec contre-proposition" },
    { "style": "Flexible", "text": "réponse plus souple" }
  ],
  "advice": "conseil stratégique sur cette situation"
}

Si le message est incompréhensible ou trop ambigu, mets "understood": false et explique dans "advice" pourquoi il faut répondre manuellement.`;

const QUICK_TEMPLATES = [
  { label: "Toujours dispo ?", msg: "Bonjour, c'est toujours disponible ?" },
  { label: "Dernier prix ?", msg: "C'est quoi votre dernier prix ?" },
  { label: "Offre basse", msg: "Je vous propose 30€ au lieu de 60€" },
  { label: "Demande de lot", msg: "Vous faites un prix si je prends les 2 ?" },
];

export default function AutoResponder() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(-1);

  const respond = async (msg) => {
    const m = msg || message;
    if (!m.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Message reçu de l'acheteur : "${m}". Contexte de l'article : ${context || "article en vente, prix ferme souhaité"}. Génère 3 réponses humaines et naturelles.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
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

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>💬 Réponses clients IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Colle le message d'un acheteur, l'IA génère 3 réponses humaines et naturelles. Si elle ne comprend pas, elle te le dit.</p>
      </div>

      {/* Templates rapides */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {QUICK_TEMPLATES.map((t, i) => (
          <button key={i} onClick={() => { setMessage(t.msg); respond(t.msg); }} style={{ padding: "6px 12px", background: "#111118", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, cursor: "pointer", color: "var(--text2)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card section">
        <div style={{ marginBottom: 12 }}>
          <label>Message reçu de l'acheteur</label>
          <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Colle le message du client ici..." />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Contexte (optionnel)</label>
          <input type="text" value={context} onChange={e => setContext(e.target.value)} placeholder="Ex: Nike AF1 en vente à 75€, je peux descendre à 65€ max" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={() => respond()} disabled={loading || !message.trim()}>
          {loading ? "⏳ Génération..." : "💬 Générer les réponses"}
        </button>
      </div>

      {result && !result.understood && (
        <div className="card section" style={{ background: "#2A1F0A", borderColor: "#5A3A0A" }}>
          <div style={{ fontWeight: 700, color: "#FCD34D", marginBottom: 6 }}>🔔 Réponse manuelle recommandée</div>
          <div style={{ fontSize: 13, color: "#E8D5A0" }}>{result.advice}</div>
        </div>
      )}

      {result && result.understood && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: "var(--text2)" }}>
            Intention détectée : <span className="badge badge-blue">{result.intent}</span>
          </div>

          {result.responses?.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#60A5FA" }}>{r.style}</span>
                <button className="btn btn-sm" onClick={() => copy(r.text, i)}>{copied === i ? "✓ Copié !" : "📋 Copier"}</button>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, background: "#0A0A0F", borderRadius: 8, padding: "10px 14px" }}>{r.text}</div>
            </div>
          ))}

          <div className="card section" style={{ background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 4 }}>🧠 Conseil stratégique</div>
            <div style={{ fontSize: 13, color: "#B0C4E8" }}>{result.advice}</div>
          </div>
        </>
      )}
    </div>
  );
}
