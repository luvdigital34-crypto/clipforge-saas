import { callClaude, getApiKey } from "../utils/api.js";
import React, { useState } from "react";

const PLATFORMS_CONFIG = {
  Vinted: { tone: "décontracté et friendly", emoji: "👗", fees: "5%" },
  "Vestiaire Collective": { tone: "luxe et professionnel", emoji: "💎", fees: "12%" },
  eBay: { tone: "accrocheur et détaillé", emoji: "🛒", fees: "13%" },
  Chrono24: { tone: "technique et précis", emoji: "⌚", fees: "6.5%" },
};

const SYSTEM = `Tu es un expert en rédaction d'annonces de vente en ligne. Tu génères des annonces optimisées pour chaque marketplace.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "listings": {
    "Vinted": { "title": "titre", "description": "description complète", "tags": ["tag1", "tag2"], "price_tip": "conseil prix" },
    "Vestiaire Collective": { "title": "titre", "description": "description", "tags": [], "price_tip": "conseil" },
    "eBay": { "title": "titre", "description": "description", "tags": [], "price_tip": "conseil" },
    "Chrono24": { "title": "titre", "description": "description", "tags": [], "price_tip": "conseil" }
  },
  "best_platform": "Vinted",
  "photo_tips": ["conseil photo 1", "conseil photo 2"],
  "negotiation_message": "message à envoyer 1 min après qu'un article est mis en favoris"
}`;

export default function ListingGenerator() {
  const [product, setProduct] = useState("");
  const [condition, setCondition] = useState("bon");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Vinted"]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [activePlatform, setActivePlatform] = useState("Vinted");

  const togglePlatform = (p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const getApiKey = () => {
    try { return JSON.parse(localStorage.getItem("clipforge-storage"))?.state?.apiKey; } catch { return null; }
  };

  const generate = async () => {
    if (!product.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/claude/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": getApiKey(),  },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          system: SYSTEM,
          messages: [{ role: "user", content: `Produit : ${product}. État : ${condition}. Prix souhaité : ${price}€. Détails : ${details}. Plateformes : ${selectedPlatforms.join(", ")}. Génère des annonces optimisées pour chaque plateforme avec le ton adapté.` }]
        })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content?.[0]?.text.replace(/```json|```/g, "").trim() || "{}");
      setResult(parsed);
      setActivePlatform(selectedPlatforms[0]);
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📝 Générateur d'annonces IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Génère des annonces optimisées pour chaque marketplace en quelques secondes.</p>
      </div>

      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Produit</label>
            <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Nike Air Max 90 taille 42 coloris blanc" />
          </div>
          <div>
            <label>Prix de vente (€)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 95" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Détails supplémentaires</label>
          <textarea rows={2} value={details} onChange={e => setDetails(e.target.value)} placeholder="Ex: Acheté en 2023, portées 5 fois, semelles propres, boîte originale incluse..." />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>État</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["neuf avec étiquette", "neuf sans étiquette", "très bon état", "bon état", "état correct"].map(c => (
              <button key={c} onClick={() => setCondition(c)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${condition === c ? "#1A1A1A" : "var(--border)"}`, background: condition === c ? "#1A1A1A" : "white", color: condition === c ? "white" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Plateformes cibles</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(PLATFORMS_CONFIG).map(([p, cfg]) => (
              <button key={p} onClick={() => togglePlatform(p)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${selectedPlatforms.includes(p) ? "#1A1A1A" : "var(--border)"}`, background: selectedPlatforms.includes(p) ? "#1A1A1A" : "white", color: selectedPlatforms.includes(p) ? "white" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>
                {cfg.emoji} {p}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={generate} disabled={loading || !product.trim()}>
          {loading ? "⏳ Génération..." : "✨ Générer les annonces"}
        </button>
      </div>

      {result && (
        <>
          {/* Tabs plateformes */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {selectedPlatforms.map(p => (
              <button key={p} onClick={() => setActivePlatform(p)} style={{ padding: "7px 16px", borderRadius: 20, border: `1px solid ${activePlatform === p ? "#1A1A1A" : "var(--border)"}`, background: activePlatform === p ? "#1A1A1A" : "white", color: activePlatform === p ? "white" : "var(--text2)", fontSize: 13, cursor: "pointer", fontWeight: activePlatform === p ? 600 : 400 }}>
                {PLATFORMS_CONFIG[p]?.emoji} {p} {result.best_platform === p && "⭐"}
              </button>
            ))}
          </div>

          {result.listings?.[activePlatform] && (
            <div className="card section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{PLATFORMS_CONFIG[activePlatform]?.emoji} {activePlatform}</div>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Frais : {PLATFORMS_CONFIG[activePlatform]?.fees}</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>TITRE</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg3)", borderRadius: 8, padding: "10px 12px" }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{result.listings[activePlatform].title}</span>
                  <button className="btn btn-sm" onClick={() => copy(result.listings[activePlatform].title, "title")}>{copied === "title" ? "✓" : "📋"}</button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 6 }}>
                  {result.listings[activePlatform].description}
                </div>
                <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => copy(result.listings[activePlatform].description, "desc")}>
                  {copied === "desc" ? "✓ Copié !" : "📋 Copier la description"}
                </button>
              </div>

              {result.listings[activePlatform].tags?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>TAGS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {result.listings[activePlatform].tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              )}

              <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#0C447C" }}>
                💡 {result.listings[activePlatform].price_tip}
              </div>
            </div>
          )}

          {/* Message favoris */}
          {result.negotiation_message && (
            <div className="card section">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>💬 Message automatique (1 min après favoris)</div>
              <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 12px", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                {result.negotiation_message}
              </div>
              <button className="btn btn-sm" onClick={() => copy(result.negotiation_message, "msg")}>{copied === "msg" ? "✓ Copié !" : "📋 Copier"}</button>
            </div>
          )}

          {/* Conseils photos */}
          {result.photo_tips && (
            <div className="card section">
              <div className="section-title">📸 Conseils photos</div>
              {result.photo_tips.map((tip, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: i < result.photo_tips.length - 1 ? "1px solid var(--border)" : "none" }}>📷 {tip}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
