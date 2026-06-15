import React, { useState } from "react";
import { useStore } from "../store/store.js";

export default function Settings() {
  const { apiKey, setApiKey } = useStore();
  const [key, setKey] = useState(apiKey || "");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);

  const save = () => {
    setApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Paramètres</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Configure ton compte ClipForge.</p>
      </div>

      <div className="card section">
        <div className="section-title">Clé API Anthropic</div>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
          Nécessaire pour les agents IA (Hook, Script, Variantes, Hashtags).
          <br />
          Obtiens ta clé sur{" "}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
            console.anthropic.com
          </a>{" "}
          → API Keys → Create Key.
        </p>

        <label>Clé API</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-sm" onClick={() => setShow((s) => !s)}>
            {show ? "Masquer" : "Voir"}
          </button>
        </div>

        {key && (
          <div style={{
            background: "var(--green-bg)", color: "var(--green)",
            borderRadius: 8, padding: "8px 12px", fontSize: 12,
            marginBottom: 12
          }}>
            ✓ Clé détectée — {key.slice(0, 12)}...{key.slice(-4)}
          </div>
        )}

        <button className="btn btn-primary" onClick={save}>
          {saved ? "✓ Sauvegardé !" : "Sauvegarder"}
        </button>
      </div>

      <div className="card section">
        <div className="section-title">Infos techniques</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          {[
            ["Modèle IA", "Claude Haiku (rapide + économique)"],
            ["Traitement vidéo", "FFmpeg WebAssembly (dans le navigateur)"],
            ["Format export", "MP4 · 1080×1920 · 9:16 · 30fps"],
            ["Agents en parallèle", "Promise.all — 4× plus rapide"],
            ["Prompt caching", "Activé — ~80% d'économie API"],
            ["Coût estimé", "~0.004€ par projet"],
            ["Stockage", "Local (navigateur) — aucun serveur"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
