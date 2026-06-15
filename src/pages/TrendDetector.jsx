import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert des tendances resell et mode 2025-2026. Tu connais les marques qui montent, les produits recherchés et les catégories rentables sur Vinted, Vestiaire Collective, eBay.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "rising_brands": [
    { "name": "marque", "trend": "+45%", "why": "raison de la montée", "avg_margin": "30-60€", "difficulty": "facile" }
  ],
  "hot_products": [
    { "name": "produit précis", "demand": "très haute", "buy_range": "40-80€", "sell_range": "90-150€", "tip": "où le trouver" }
  ],
  "profitable_categories": [
    { "name": "catégorie", "margin_avg": "45%", "competition": "moyenne", "verdict": "pourquoi c'est rentable" }
  ],
  "declining": ["marque ou produit en baisse 1", "produit 2"],
  "weekly_action": "action concrète à faire cette semaine pour profiter des tendances"
}`;

export default function TrendDetector() {
  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Niche d'intérêt : ${niche || "mode et streetwear général"}. Budget par achat : ${budget || "50-150"}€. Donne-moi les tendances actuelles du resell avec des données réalistes.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
      });
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📈 Détecteur de tendances</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Les marques qui montent, les produits les plus recherchés et les catégories rentables.</p>
      </div>

      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label>Ta niche (optionnel)</label>
            <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: sneakers, streetwear, montres, luxe..." />
          </div>
          <div>
            <label>Budget par achat (€)</label>
            <input type="text" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Ex: 50-150" />
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={detect} disabled={loading}>
          {loading ? "⏳ Analyse des tendances..." : "📈 Détecter les tendances"}
        </button>
      </div>

      {result && (
        <>
          {/* Action de la semaine */}
          <div className="card section" style={{ background: "linear-gradient(135deg, #1E2A4A, #0D1B2A)", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>⚡ Action de la semaine</div>
            <div style={{ fontSize: 14, color: "#D0E0FF" }}>{result.weekly_action}</div>
          </div>

          {/* Marques qui montent */}
          <div className="card section">
            <div className="section-title">🚀 Marques qui montent</div>
            {result.rising_brands?.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < result.rising_brands.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ minWidth: 60, fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>{b.trend}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{b.why}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#60A5FA" }}>{b.avg_margin}</div>
                  <span className="badge badge-blue">{b.difficulty}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Produits chauds */}
          <div className="card section">
            <div className="section-title">🔥 Produits les plus recherchés</div>
            {result.hot_products?.map((p, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < result.hot_products.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                  <span className="badge badge-green">Demande {p.demand}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  Achat : <strong style={{ color: "#FCD34D" }}>{p.buy_range}</strong> → Revente : <strong style={{ color: "#4ADE80" }}>{p.sell_range}</strong>
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>💡 {p.tip}</div>
              </div>
            ))}
          </div>

          {/* Catégories + déclin */}
          <div className="grid-2 section">
            <div className="card">
              <div className="section-title">💰 Catégories rentables</div>
              {result.profitable_categories?.map((c, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < result.profitable_categories.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontSize: 13, color: "#4ADE80", fontWeight: 600 }}>{c.margin_avg}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{c.verdict}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="section-title">📉 En déclin (à éviter)</div>
              {result.declining?.map((d, i) => <div key={i} style={{ fontSize: 13, padding: "6px 0", color: "#F87171" }}>↓ {d}</div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
