import React, { useState, useRef } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert en authentification de produits de luxe, sneakers, montres et vêtements de marque. Tu analyses les descriptions et détails fournis pour détecter si un produit est authentique ou contrefait.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "product_detected": "nom du produit détecté",
  "category": "sneakers" ou "montre" ou "vetement" ou "sac" ou "autre",
  "verdict": "authentique" ou "suspect" ou "contrefait" ou "impossible_a_determiner",
  "confidence": 87,
  "score": 8.5,
  "red_flags": ["problème détecté 1", "problème 2"],
  "green_flags": ["point positif 1", "point positif 2"],
  "verification_points": [
    { "point": "élément à vérifier", "how": "comment vérifier", "status": "ok" ou "suspect" ou "a_verifier" }
  ],
  "market_value": { "authentic": "200-280€", "fake": "20-40€" },
  "recommendation": "conseil final détaillé",
  "ask_for": ["photo supplémentaire nécessaire 1", "info manquante 2"]
}`;

const CATEGORIES = [
  { id: "sneakers", label: "Sneakers", emoji: "👟", examples: "Nike, Jordan, Yeezy, New Balance, Adidas..." },
  { id: "montre", label: "Montre", emoji: "⌚", examples: "Rolex, AP, Patek, Omega, Cartier..." },
  { id: "vetement", label: "Vêtement", emoji: "👗", examples: "Stone Island, Moncler, Ralph Lauren, Carhartt..." },
  { id: "sac", label: "Sac de luxe", emoji: "👜", examples: "Louis Vuitton, Chanel, Hermès, Dior..." },
  { id: "bijou", label: "Bijou", emoji: "💍", examples: "Cartier, Tiffany, Chopard..." },
  { id: "autre", label: "Autre", emoji: "📦", examples: "Tech, sport, accessoires..." },
];

export default function ProductAuth() {
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [details, setDetails] = useState("");
  const [price, setPrice] = useState("");
  const [seller, setSeller] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!category || !brand) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{
          role: "user",
          content: `Catégorie : ${category}. Marque : ${brand}. Modèle/Référence : ${model || "non précisé"}. Détails observés : ${details || "non précisé"}. Prix proposé : ${price || "non précisé"}€. Contexte vendeur : ${seller || "non précisé"}. Analyse l'authenticité de ce produit et identifie les points suspects.`
        }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
      });
      const clean = text.replace(/```json|```/g, "").replace(/[\x00-\x1F\x7F]/g, " ").trim();
      const match = clean.match(/(\{[\s\S]*\})/);
      setResult(JSON.parse(match ? match[0] : clean));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const VERDICT_STYLE = {
    "authentique": { bg: "#0F2A1A", color: "#4ADE80", emoji: "✅", label: "AUTHENTIQUE" },
    "suspect": { bg: "#2A1F0A", color: "#FCD34D", emoji: "⚠️", label: "SUSPECT" },
    "contrefait": { bg: "#2A0F0F", color: "#F87171", emoji: "❌", label: "CONTREFAIT" },
    "impossible_a_determiner": { bg: "#1A1A24", color: "#9090B0", emoji: "🔍", label: "INFOS INSUFFISANTES" },
  };

  const STATUS_COLOR = { ok: "#4ADE80", suspect: "#F87171", a_verifier: "#FCD34D" };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🔍 Authentification produit IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Détecte les contrefaçons avant d'acheter — sneakers, montres, vêtements, sacs de luxe.</p>
      </div>

      {/* Catégorie */}
      <div className="section">
        <div className="section-title">Catégorie du produit</div>
        <div className="grid-3">
          {CATEGORIES.map(c => (
            <div key={c.id} onClick={() => setCategory(c.id)} style={{
              border: `1px solid ${category === c.id ? "#3B82F6" : "var(--border)"}`,
              background: category === c.id ? "#1E2A4A" : "#111118",
              borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              boxShadow: category === c.id ? "0 0 12px rgba(59,130,246,0.2)" : "none",
              transition: "all .15s"
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{c.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: category === c.id ? "#60A5FA" : "var(--text)" }}>{c.label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{c.examples}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Infos produit */}
      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Marque *</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: Rolex, Nike, Stone Island..." />
          </div>
          <div>
            <label>Modèle / Référence</label>
            <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Ex: Submariner 116610, Air Jordan 1 Retro..." />
          </div>
          <div>
            <label>Prix proposé (€)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 250" />
          </div>
          <div>
            <label>Contexte vendeur</label>
            <input type="text" value={seller} onChange={e => setSeller(e.target.value)} placeholder="Ex: Vinted 4.8/5, Leboncoin particulier..." />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Détails observés (description, photos, défauts...)</label>
          <textarea rows={4} value={details} onChange={e => setDetails(e.target.value)}
            placeholder="Décris tout ce que tu vois : coutures, logo, étiquettes, numéro de série, boîte, couleurs, matières, finitions, emballage...&#10;&#10;Plus tu donnes de détails, plus l'analyse sera précise !" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={analyze} disabled={loading || !category || !brand.trim()}>
          {loading ? "⏳ Analyse en cours..." : "🔍 Analyser l'authenticité"}
        </button>
      </div>

      {result && (
        <>
          {/* Verdict principal */}
          <div style={{
            background: VERDICT_STYLE[result.verdict]?.bg,
            border: `2px solid ${VERDICT_STYLE[result.verdict]?.color}`,
            borderRadius: 16, padding: "24px",
            boxShadow: `0 0 30px ${VERDICT_STYLE[result.verdict]?.color}22`,
            marginBottom: 16, display: "flex", alignItems: "center", gap: 20
          }}>
            <div style={{ fontSize: 48 }}>{VERDICT_STYLE[result.verdict]?.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: VERDICT_STYLE[result.verdict]?.color }}>
                {VERDICT_STYLE[result.verdict]?.label}
              </div>
              <div style={{ fontSize: 14, color: VERDICT_STYLE[result.verdict]?.color, opacity: 0.8, marginTop: 4 }}>
                {result.product_detected} · Confiance : {result.confidence}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: VERDICT_STYLE[result.verdict]?.color }}>{result.score}</div>
              <div style={{ fontSize: 11, color: VERDICT_STYLE[result.verdict]?.color, opacity: 0.7 }}>/10</div>
            </div>
          </div>

          {/* Valeur marché */}
          <div className="grid-2 section">
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>VALEUR AUTHENTIQUE</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#4ADE80" }}>{result.market_value?.authentic}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>VALEUR CONTREFAÇON</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#F87171" }}>{result.market_value?.fake}</div>
            </div>
          </div>

          {/* Points positifs + red flags */}
          <div className="grid-2 section">
            <div className="card">
              <div className="section-title" style={{ color: "#4ADE80" }}>✅ Points positifs</div>
              {result.green_flags?.length > 0
                ? result.green_flags.map((g, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", color: "#4ADE80" }}>✓ {g}</div>)
                : <div style={{ fontSize: 13, color: "var(--text3)" }}>Aucun point positif détecté</div>}
            </div>
            <div className="card">
              <div className="section-title" style={{ color: "#F87171" }}>🚩 Red flags</div>
              {result.red_flags?.length > 0
                ? result.red_flags.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", color: "#F87171" }}>✗ {r}</div>)
                : <div style={{ fontSize: 13, color: "var(--text3)" }}>Aucun red flag détecté</div>}
            </div>
          </div>

          {/* Points de vérification */}
          {result.verification_points?.length > 0 && (
            <div className="card section">
              <div className="section-title">🔬 Points de vérification détaillés</div>
              {result.verification_points.map((v, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < result.verification_points.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[v.status], flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${STATUS_COLOR[v.status]}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v.point}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{v.how}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${STATUS_COLOR[v.status]}22`, color: STATUS_COLOR[v.status] }}>
                    {v.status === "ok" ? "OK" : v.status === "suspect" ? "SUSPECT" : "À VÉRIFIER"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recommandation */}
          <div className="card section" style={{ background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 700, color: "#60A5FA", marginBottom: 8 }}>💡 Recommandation finale</div>
            <div style={{ fontSize: 14, color: "#D0E0FF", lineHeight: 1.6 }}>{result.recommendation}</div>
          </div>

          {/* Photos manquantes */}
          {result.ask_for?.length > 0 && (
            <div className="card section" style={{ background: "#2A1F0A", borderColor: "#5A3A0A" }}>
              <div style={{ fontWeight: 700, color: "#FCD34D", marginBottom: 8 }}>📸 Infos/photos supplémentaires nécessaires</div>
              {result.ask_for.map((a, i) => <div key={i} style={{ fontSize: 13, color: "#E8D5A0", padding: "3px 0" }}>→ {a}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
