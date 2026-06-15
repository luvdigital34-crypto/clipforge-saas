import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

const SYSTEM = `Tu es un expert e-commerce et SEO. Tu génères des fiches produits Shopify optimisées qui convertissent.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "title": "titre produit SEO optimisé",
  "description_html": "description complète avec arguments de vente (texte simple avec sauts de ligne)",
  "bullet_points": ["argument de vente 1", "argument 2", "argument 3", "argument 4"],
  "meta_title": "méta titre SEO 60 caractères max",
  "meta_description": "méta description SEO 155 caractères max",
  "faq": [
    { "question": "question fréquente", "answer": "réponse" }
  ],
  "keywords": ["mot-clé 1", "mot-clé 2"],
  "price_suggestion": "conseil de prix psychologique"
}`;

export default function ProductSheets() {
  const [product, setProduct] = useState("");
  const [source, setSource] = useState("");
  const [tone, setTone] = useState("professionnel");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const generate = async () => {
    if (!product.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Produit : ${product}. Infos fournisseur/détails : ${source || "aucune info supplémentaire"}. Ton : ${tone}. Génère une fiche produit Shopify complète et optimisée SEO en français.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
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
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🛍️ Fiches produits e-commerce</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Description SEO, arguments de vente, FAQ et méta descriptions — prêt à coller dans Shopify.</p>
      </div>

      <div className="card section">
        <div style={{ marginBottom: 12 }}>
          <label>Produit</label>
          <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Ex: Montre connectée étanche avec suivi cardiaque" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Infos fournisseur / caractéristiques (colle tout, l'IA nettoie)</label>
          <textarea rows={3} value={source} onChange={e => setSource(e.target.value)} placeholder="Colle ici les specs du fournisseur AliExpress ou tes notes en vrac..." />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Ton</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["professionnel", "fun", "luxe", "technique"].map(t => (
              <button key={t} onClick={() => setTone(t)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${tone === t ? "#3B82F6" : "var(--border)"}`, background: tone === t ? "#1E2A4A" : "#111118", color: tone === t ? "#60A5FA" : "var(--text2)", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={generate} disabled={loading || !product.trim()}>
          {loading ? "⏳ Génération..." : "🛍️ Générer la fiche produit"}
        </button>
      </div>

      {result && (
        <>
          <div className="card section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Titre produit</div>
              <button className="btn btn-sm" onClick={() => copy(result.title, "title")}>{copied === "title" ? "✓" : "📋"}</button>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{result.title}</div>
          </div>

          <div className="card section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Description</div>
              <button className="btn btn-sm" onClick={() => copy(result.description_html, "desc")}>{copied === "desc" ? "✓ Copié !" : "📋 Copier"}</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#0A0A0F", borderRadius: 8, padding: "12px 14px" }}>{result.description_html}</div>
          </div>

          <div className="grid-2 section">
            <div className="card">
              <div className="section-title">Arguments de vente</div>
              {result.bullet_points?.map((b, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0" }}>✓ {b}</div>)}
            </div>
            <div className="card">
              <div className="section-title">SEO</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>META TITRE</div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{result.meta_title}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>META DESCRIPTION</div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{result.meta_description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {result.keywords?.map(k => <span key={k} className="tag">{k}</span>)}
              </div>
            </div>
          </div>

          <div className="card section">
            <div className="section-title">FAQ générée</div>
            {result.faq?.map((f, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < result.faq.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#60A5FA" }}>{f.question}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{f.answer}</div>
              </div>
            ))}
          </div>

          <div className="card section" style={{ background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 4 }}>💰 Conseil prix</div>
            <div style={{ fontSize: 13, color: "#B0C4E8" }}>{result.price_suggestion}</div>
          </div>
        </>
      )}
    </div>
  );
}
