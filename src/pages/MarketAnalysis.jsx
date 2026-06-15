import { callClaude, getApiKey } from "../utils/api.js";
import React, { useState } from "react";

const SYSTEM = `Tu es un expert en analyse de marché pour le resell. Tu analyses les produits et donnes des recommandations précises basées sur les données des marketplaces (Vinted, Vestiaire Collective, Chrono24, eBay, StockX, GOAT).

Pour chaque analyse tu fournis UNIQUEMENT ce JSON (sans markdown) :
{
  "product": "nom du produit",
  "market_summary": "résumé du marché en 2 phrases",
  "platforms": [
    {
      "name": "Vinted",
      "avg_price": 85,
      "min_price": 60,
      "max_price": 120,
      "demand": "haute",
      "competition": "forte",
      "fees_percent": 5,
      "recommended": true,
      "reason": "pourquoi recommandé ou non"
    }
  ],
  "prices": {
    "quick_sale": 75,
    "optimal": 95,
    "premium": 130
  },
  "best_platform": "Vinted",
  "best_platform_reason": "raison principale",
  "tips": ["conseil 1", "conseil 2", "conseil 3"],
  "trend": "hausse",
  "trend_reason": "raison de la tendance"
}`;

export default function MarketAnalysis() {
  const [product, setProduct] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [condition, setCondition] = useState("bon");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const getApiKey = () => {
    try { return JSON.parse(localStorage.getItem("clipforge-storage"))?.state?.apiKey; } catch { return null; }
  };

  const analyze = async () => {
    if (!product.trim()) { setError("Entre un produit."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
     const text = await callClaude({
        system: SYSTEM,
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: `Analyse le marché pour : ${product}. État : ${condition}. Prix d'achat : ${purchasePrice || "inconnu"}€. Donne des prix réalistes basés sur le marché actuel 2025.` }]
      });
      const clean = text.replace(/```json|```/g, "").trim();
      const match = clean.match(/(\{[\s\S]*\})/);
      setResult(JSON.parse(match ? match[0] : clean));
    } catch (err) {
      setError("Erreur : " + err.message);
    } finally { setLoading(false); }
  };

  const DEMAND_COLOR = { haute: "#27500A", moyenne: "#633806", faible: "#712B13" };
  const DEMAND_BG = { haute: "#EAF3DE", moyenne: "#FAEEDA", faible: "#FAECE7" };
  const TREND_ICON = { hausse: "📈", baisse: "📉", stable: "➡️" };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📊 Analyse de marché IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Compare les prix sur toutes les plateformes et trouve la meilleure stratégie de vente.</p>
      </div>

      <div className="card section">
        <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
          <div>
            <label>Produit</label>
            <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Nike Air Force 1 taille 42, Rolex Submariner, iPhone 14 Pro..." onKeyDown={e => e.key === "Enter" && analyze()} />
          </div>
          <div>
            <label>Prix d'achat (€)</label>
            <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="Ex: 80" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>État du produit</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["neuf", "excellent", "bon", "correct", "abimé"].map(c => (
              <button key={c} onClick={() => setCondition(c)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${condition === c ? "#1A1A1A" : "var(--border)"}`, background: condition === c ? "#1A1A1A" : "white", color: condition === c ? "white" : "var(--text2)", fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{c}</button>
            ))}
          </div>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 10 }}>⚠️ {error}</div>}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={analyze} disabled={loading}>
          {loading ? "⏳ Analyse en cours..." : "🔍 Analyser le marché"}
        </button>
      </div>

      {result && (
        <>
          {/* Résumé */}
          <div className="card section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 22 }}>{TREND_ICON[result.trend] || "📊"}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{result.product}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{result.market_summary}</div>
              </div>
            </div>
            <div style={{ background: "var(--green-bg)", color: "var(--green)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500 }}>
              ✅ Meilleure plateforme : {result.best_platform} — {result.best_platform_reason}
            </div>
          </div>

          {/* Prix */}
          <div className="section">
            <div className="section-title">Stratégie de prix</div>
            <div className="grid-3">
              {[
                { label: "⚡ Vente rapide", price: result.prices?.quick_sale, desc: "Vendu en 24-48h", color: "#185FA5", bg: "#E6F1FB" },
                { label: "🎯 Prix optimal", price: result.prices?.optimal, desc: "Meilleur ratio vitesse/marge", color: "#27500A", bg: "#EAF3DE" },
                { label: "💎 Prix premium", price: result.prices?.premium, desc: "Acheteur patient", color: "#712B13", bg: "#FAECE7" },
              ].map(p => (
                <div key={p.label} style={{ background: p.bg, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: p.color }}>{p.price}€</div>
                  {purchasePrice && <div style={{ fontSize: 11, color: p.color, marginTop: 4 }}>+{Math.round(p.price - purchasePrice)}€ de marge</div>}
                  <div style={{ fontSize: 11, color: p.color, opacity: 0.8, marginTop: 2 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plateformes */}
          <div className="card section">
            <div className="section-title">Comparaison des plateformes</div>
            {result.platforms?.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, background: p.recommended ? "#1A1A1A" : "var(--bg3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {p.name === "Vinted" ? "👗" : p.name === "Vestiaire" ? "💎" : p.name === "eBay" ? "🛒" : p.name === "Chrono24" ? "⌚" : "📦"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                    {p.recommended && <span style={{ fontSize: 10, background: "#1A1A1A", color: "white", padding: "1px 6px", borderRadius: 8 }}>Recommandé</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{p.reason}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.avg_price}€ moy.</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.min_price}€ — {p.max_price}€</div>
                  <span style={{ fontSize: 10, background: DEMAND_BG[p.demand], color: DEMAND_COLOR[p.demand], padding: "1px 6px", borderRadius: 8 }}>
                    Demande {p.demand}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="card section">
            <div className="section-title">Conseils pour maximiser la vente</div>
            {result.tips?.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < result.tips.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13 }}>
                <span style={{ color: "#185FA5", fontWeight: 700, flexShrink: 0 }}>💡</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
