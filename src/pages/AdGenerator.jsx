import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert en publicité digitale (Meta Ads, TikTok, UGC). Tu génères des publicités qui convertissent.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "meta_ads": [
    { "headline": "titre accrocheur", "primary_text": "texte principal de l'ad", "cta": "Acheter maintenant", "angle": "angle marketing utilisé" }
  ],
  "tiktok_hooks": [
    { "hook": "phrase des 3 premières secondes", "concept": "concept de la vidéo en 1 phrase" }
  ],
  "ugc_script": {
    "duration": "30s",
    "scenes": [
      { "time": "0-3s", "action": "ce qui se passe", "dialogue": "ce qui est dit" }
    ]
  },
  "variants": ["variante de message 1", "variante 2", "variante 3"]
}`;

export default function AdGenerator() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("ventes");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("meta");
  const [copied, setCopied] = useState("");

  const generate = async () => {
    if (!product.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Produit : ${product}. Audience cible : ${audience || "18-35 ans intéressés par la mode"}. Objectif : ${goal}. Génère 3 Meta ads, 5 hooks TikTok, 1 script UGC complet et 3 variantes de message.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
      });
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
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
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📣 Générateur de pubs IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Ads Meta, hooks TikTok, scripts UGC — tout pour vendre ton produit.</p>
      </div>

      <div className="card section">
        <div style={{ marginBottom: 12 }}>
          <label>Produit / Offre</label>
          <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Sneakers Nike vintage reconditionnées, livraison 48h" />
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label>Audience cible</label>
            <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ex: hommes 18-30 streetwear" />
          </div>
          <div>
            <label>Objectif</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="ventes">Ventes directes</option>
              <option value="trafic">Trafic vers le site</option>
              <option value="notoriete">Notoriété de marque</option>
              <option value="followers">Gagner des followers</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={generate} disabled={loading || !product.trim()}>
          {loading ? "⏳ Génération..." : "📣 Générer mes pubs"}
        </button>
      </div>

      {result && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["meta", "📘 Meta Ads"], ["tiktok", "🎵 Hooks TikTok"], ["ugc", "🎬 Script UGC"], ["variants", "🔀 Variantes"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${tab === k ? "#3B82F6" : "var(--border)"}`, background: tab === k ? "#1E2A4A" : "#111118", color: tab === k ? "#60A5FA" : "var(--text2)", fontSize: 13, cursor: "pointer", fontWeight: tab === k ? 600 : 400 }}>{l}</button>
            ))}
          </div>

          {tab === "meta" && result.meta_ads?.map((ad, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="badge badge-blue">{ad.angle}</span>
                <button className="btn btn-sm" onClick={() => copy(`${ad.headline}\n\n${ad.primary_text}\n\nCTA: ${ad.cta}`, `meta${i}`)}>{copied === `meta${i}` ? "✓" : "📋"}</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{ad.headline}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text2)", marginBottom: 8 }}>{ad.primary_text}</div>
              <span style={{ fontSize: 12, background: "#3B82F6", color: "white", padding: "4px 12px", borderRadius: 6 }}>{ad.cta}</span>
            </div>
          ))}

          {tab === "tiktok" && result.tiktok_hooks?.map((h, i) => (
            <div key={i} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#60A5FA" }}>"{h.hook}"</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{h.concept}</div>
                </div>
                <button className="btn btn-sm" onClick={() => copy(h.hook, `tk${i}`)}>{copied === `tk${i}` ? "✓" : "📋"}</button>
              </div>
            </div>
          ))}

          {tab === "ugc" && result.ugc_script && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🎬 Script UGC — {result.ugc_script.duration}</div>
              {result.ugc_script.scenes?.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < result.ugc_script.scenes.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ minWidth: 50, fontSize: 12, fontWeight: 700, color: "#FCD34D" }}>{s.time}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.action}</div>
                    <div style={{ fontSize: 13, color: "#60A5FA", fontStyle: "italic", marginTop: 2 }}>"{s.dialogue}"</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "variants" && result.variants?.map((v, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{v}</div>
              <button className="btn btn-sm" onClick={() => copy(v, `v${i}`)}>{copied === `v${i}` ? "✓" : "📋"}</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
