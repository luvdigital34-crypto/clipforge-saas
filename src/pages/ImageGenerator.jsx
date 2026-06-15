import React, { useState } from "react";

const OPENAI_KEY_STORAGE = "clipforge-openai-key";

export default function ImageGenerator() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(OPENAI_KEY_STORAGE) || "");
  const [keySaved, setKeySaved] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const saveKey = () => {
    localStorage.setItem(OPENAI_KEY_STORAGE, apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const STYLES = [
    { id: "photorealistic", label: "Photo réaliste", emoji: "📷" },
    { id: "digital art", label: "Art digital", emoji: "🎨" },
    { id: "product photography", label: "Photo produit", emoji: "🛍️" },
    { id: "minimalist", label: "Minimaliste", emoji: "⬜" },
    { id: "cinematic", label: "Cinématique", emoji: "🎬" },
    { id: "illustration", label: "Illustration", emoji: "✏️" },
  ];

  const QUICK_PROMPTS = [
    "Sneakers Nike Air Force 1 blanches sur fond blanc épuré, photo produit professionnelle",
    "Montre de luxe Rolex sur fond sombre avec reflets dorés, photo studio",
    "Veste Stone Island sur cintre blanc, fond neutre, e-commerce",
    "Logo minimaliste pour boutique de resell streetwear, bleu et noir",
    "Bannière TikTok pour compte sneakers, style urban moderne",
    "Photo de présentation produit luxe fond marbre blanc",
  ];

  const generate = async () => {
    if (!prompt.trim()) { alert("Entre un prompt !"); return; }
    if (!apiKey) { alert("Configure ta clé OpenAI d'abord !"); return; }
    setLoading(true); setImages([]);

    try {
      const enhancedPrompt = `${prompt}, ${style} style, high quality, professional`;
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const urls = data.data.map(img => img.url);
      setImages(urls);
      setHistory(prev => [{ prompt, style, urls, date: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎨 Générateur d'images IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Crée des visuels professionnels avec DALL-E 3 — photos produits, bannières, logos.</p>
      </div>

      {/* Clé OpenAI */}
      <div className="card section" style={{ borderColor: apiKey ? "var(--border)" : "#EF9F27", background: apiKey ? "var(--bg2)" : "var(--amber-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{apiKey ? "✅" : "⚠️"}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{apiKey ? "Clé OpenAI configurée" : "Configure ta clé OpenAI (DALL-E)"}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>
              {apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}` : <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>platform.openai.com → API Keys</a>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && saveKey()} />
          <button className="btn btn-sm btn-primary" onClick={saveKey}>{keySaved ? "✓" : "Sauvegarder"}</button>
        </div>
      </div>

      {/* Style */}
      <div className="section">
        <div className="section-title">Style</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id)} style={{
              padding: "6px 12px", borderRadius: 20,
              border: `1px solid ${style === s.id ? "#3B82F6" : "var(--border)"}`,
              background: style === s.id ? "var(--blue-bg)" : "var(--bg2)",
              color: style === s.id ? "var(--blue)" : "var(--text2)",
              fontSize: 12, cursor: "pointer"
            }}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="grid-2 section">
        <div>
          <label>Format</label>
          <select value={size} onChange={e => setSize(e.target.value)}>
            <option value="1024x1024">Carré 1024×1024</option>
            <option value="1792x1024">Paysage 1792×1024</option>
            <option value="1024x1792">Portrait 1024×1792 (TikTok)</option>
          </select>
        </div>
        <div>
          <label>Qualité</label>
          <select value={quality} onChange={e => setQuality(e.target.value)}>
            <option value="standard">Standard (~0.04$)</option>
            <option value="hd">HD (~0.08$)</option>
          </select>
        </div>
      </div>

      {/* Prompt */}
      <div className="card section">
        <label>Décris l'image que tu veux</label>
        <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: Photo produit professionnelle de sneakers Nike Air Force 1 blanches sur fond blanc épuré avec ombres douces..."
          style={{ marginBottom: 8 }}
        />
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>Prompts rapides :</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => setPrompt(p)} style={{
                padding: "3px 10px", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--bg3)",
                color: "var(--text2)", fontSize: 11, cursor: "pointer"
              }}>
                {p.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? "⏳ Génération en cours..." : "🎨 Générer l'image"}
        </button>
      </div>

      {/* Résultat */}
      {images.length > 0 && (
        <div className="section">
          <div className="section-title">Image générée</div>
          {images.map((url, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <img src={url} alt="Generated" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a href={url} download="clipforge-image.png" target="_blank" rel="noreferrer"
                  className="btn btn-primary" style={{ flex: 1, justifyContent: "center", textDecoration: "none", fontSize: 13 }}>
                  ⬇️ Télécharger
                </a>
                <button className="btn" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(url)}>
                  📋 Copier l'URL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div className="card section">
          <div className="section-title">Historique</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
              {h.urls?.[0] && <img src={h.urls[0]} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{h.prompt.slice(0, 50)}...</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{h.style} · {h.date}</div>
              </div>
              <button className="btn btn-sm" onClick={() => setImages(h.urls)}>Voir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
