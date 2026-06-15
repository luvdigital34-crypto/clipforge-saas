import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";

export default function Dashboard() {
  const { history, agentResults, apiKey, setApiKey } = useStore();
  const navigate = useNavigate();
  const [keyInput, setKeyInput] = useState(apiKey || "");
  const [keySaved, setKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Auto-charge la clé depuis .env si pas encore configurée
  useEffect(() => {
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (envKey && envKey.startsWith("sk-") && !apiKey) {
      setApiKey(envKey);
      setKeyInput(envKey);
    }
  }, []);

  const saveKey = () => {
    setApiKey(keyInput.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const lastVariants = agentResults?.variants || [];
  const totalVideos = history.length;

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          Crée des vidéos TikTok virales automatiquement avec des agents IA.
        </p>
      </div>

      {/* Clé API */}
      <div className="card section" style={{ borderColor: apiKey ? "var(--border)" : "#EF9F27", background: apiKey ? "var(--bg2)" : "var(--amber-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{apiKey ? "✅" : "⚠️"}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {apiKey ? "Clé API configurée" : "Configure ta clé API Anthropic"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              {apiKey
                ? `${apiKey.slice(0, 14)}...${apiKey.slice(-4)}`
                : <>Obtiens-la sur <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>console.anthropic.com</a></>
              }
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveKey()}
              placeholder="sk-ant-..."
            />
            <button
              onClick={() => setShowKey(s => !s)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
          <button className="btn btn-primary" onClick={saveKey}>
            {keySaved ? "✓ Sauvé !" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3 section">
        <div className="stat-card">
          <div className="stat-val">{totalVideos}</div>
          <div className="stat-lbl">Projets créés</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{totalVideos * 3}</div>
          <div className="stat-lbl">Vidéos générées</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">~{(totalVideos * 0.012).toFixed(2)}€</div>
          <div className="stat-lbl">Coût API total</div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="section">
        <div className="section-title">Démarrer</div>
        <div className="grid-2">
          <div className="card" style={{ cursor: "pointer" }} onClick={() => navigate("/create")}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Nouveau projet</div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>Colle un script, ajoute des images, et laisse les agents IA créer tes vidéos.</div>
          </div>
          <div className="card" style={{ cursor: "pointer" }} onClick={() => navigate("/results")}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Dernières variantes</div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>{lastVariants.length > 0 ? `${lastVariants.length} variantes disponibles` : "Lance un projet pour voir tes vidéos ici."}</div>
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="card section">
        <div className="section-title">Comment ça marche</div>
        {[
          { icon: "📝", title: "Tu fournis le script + images", sub: "Colle ton texte, importe tes photos" },
          { icon: "🤖", title: "4 agents IA tournent en parallèle", sub: "Hook · Script · Variantes · Hashtags — simultanément" },
          { icon: "🎬", title: "3 vidéos TikTok sont générées", sub: "Différents rythmes, filtres et styles" },
          { icon: "⬇️", title: "Tu télécharges et tu postes", sub: "Format vertical 9:16 prêt pour TikTok" },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontSize: 22 }}>{step.icon}</div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
