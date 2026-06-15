import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert en resell qui évalue les produits avant achat. Tu donnes des scores précis et réalistes basés sur le marché 2025-2026.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "product": "nom du produit",
  "score": 8,
  "score_label": "Très bon deal",
  "estimated_resale": { "min": 60, "max": 90, "realistic": 75 },
  "estimated_margin": 35,
  "margin_percent": 87,
  "sale_speed": "rapide",
  "sale_speed_days": "3-7 jours",
  "demand_level": "haute",
  "verdict": "achète" ou "négocie" ou "passe",
  "verdict_reason": "explication concrète",
  "negotiation_tip": "conseil pour négocier le prix d'achat",
  "best_platform": "Vinted",
  "risks": ["risque 1", "risque 2"],
  "selling_tips": ["conseil 1", "conseil 2"]
}`;

export default function ProductScorer() {
  const [product, setProduct] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [condition, setCondition] = useState("bon état");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const score = async () => {
    if (!product.trim() || !buyPrice) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Produit : ${product}. Prix demandé : ${buyPrice}€. État : ${condition}. Note ce produit avant achat avec des estimations réalistes.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
      });
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const scoreColor = result ? (result.score >= 7 ? "#4ADE80" : result.score >= 5 ? "#FCD34D" : "#F87171") : "#3B82F6";
  const VERDICT_STYLE = {
    "achète": { bg: "#0F2A1A", color: "#4ADE80", emoji: "✅" },
    "négocie": { bg: "#2A1F0A", color: "#FCD34D", emoji: "🤝" },
    "passe": { bg: "#2A0F0F", color: "#F87171", emoji: "❌" },
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎯 Noteur de produit IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Avant d'acheter, l'IA note le produit : potentiel de vente, marge estimée, vitesse de revente.</p>
      </div>

      <div className="card section">
        <div style={{ marginBottom: 12 }}>
          <label>Produit (description précise)</label>
          <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Veste Stone Island Ghost Piece taille M noire 2022" onKeyDown={e => e.key === "Enter" && score()} />
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label>Prix demandé (€)</label>
            <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="Ex: 120" />
          </div>
          <div>
            <label>État</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}>
              {["neuf avec étiquette", "neuf sans étiquette", "excellent état", "bon état", "état correct", "abimé"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={score} disabled={loading || !product.trim() || !buyPrice}>
          {loading ? "⏳ Analyse en cours..." : "🎯 Noter ce produit"}
        </button>
      </div>

      {result && (
        <>
          {/* Score principal */}
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "#111118", border: `2px solid ${scoreColor}`, borderRadius: 16, padding: "24px 28px", textAlign: "center", boxShadow: `0 0 20px ${scoreColor}33` }}>
              <div style={{ fontSize: 44, fontWeight: 700, color: scoreColor }}>{result.score}<span style={{ fontSize: 20, opacity: 0.6 }}>/10</span></div>
              <div style={{ fontSize: 13, color: scoreColor, fontWeight: 600 }}>{result.score_label}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: VERDICT_STYLE[result.verdict]?.bg, borderRadius: 12, padding: "14px 16px", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: VERDICT_STYLE[result.verdict]?.color }}>
                  {VERDICT_STYLE[result.verdict]?.emoji} {result.verdict?.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: VERDICT_STYLE[result.verdict]?.color, marginTop: 4, opacity: 0.9 }}>{result.verdict_reason}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid-3 section">
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#4ADE80" }}>+{result.estimated_margin}€</div>
              <div className="stat-lbl">Marge estimée ({result.margin_percent}%)</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#60A5FA" }}>{result.estimated_resale?.realistic}€</div>
              <div className="stat-lbl">Prix de revente ({result.estimated_resale?.min}-{result.estimated_resale?.max}€)</div>
            </div>
            <div className="stat-card">
              <div className="stat-val" style={{ color: "#FCD34D" }}>{result.sale_speed_days}</div>
              <div className="stat-lbl">Vitesse de vente ({result.sale_speed})</div>
            </div>
          </div>

          {/* Négociation */}
          <div className="card section" style={{ background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 6 }}>🤝 Astuce négociation</div>
            <div style={{ fontSize: 13, color: "#B0C4E8" }}>{result.negotiation_tip}</div>
          </div>

          {/* Risques + conseils */}
          <div className="grid-2 section">
            <div className="card">
              <div className="section-title">⚠️ Risques</div>
              {result.risks?.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", color: "#F87171" }}>✗ {r}</div>)}
            </div>
            <div className="card">
              <div className="section-title">💡 Conseils de vente</div>
              {result.selling_tips?.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0" }}>→ {t}</div>)}
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text3)" }}>📍 Meilleure plateforme : <strong style={{ color: "#60A5FA" }}>{result.best_platform}</strong></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
