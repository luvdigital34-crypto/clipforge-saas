import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";
import { runAllAgents } from "../agents/agents.js";

export default function CreateProject() {
  const { apiKey, setProject, setAgentResults, setRenderResult, setPipeline, addToHistory, reset } = useStore();
  const navigate = useNavigate();
  const [script, setScript] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    const newImgs = files.map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
    setImages(prev => [...prev, ...newImgs].slice(0, 10));
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!script.trim()) { setError("Entre un script !"); return; }
    if (!apiKey) { setError("Configure ta clé API dans le Dashboard."); return; }
    setError("");
    reset();

    const project = { script, images };
    setProject(project);
    navigate("/pipeline");

    try {
      setPipeline("running_agents", "Lancement des agents IA...", 5);

      const results = await runAllAgents(apiKey, project, (msg, pct) => {
        setPipeline("running_agents", msg, pct);
      });

      setAgentResults(results);
      setPipeline("rendering", "Génération des variantes...", 88);

      // Génère des résultats simulés pour chaque variante
      const variants = results.variants || [];
      for (const variant of variants) {
        setRenderResult(variant.id, {
          success: true,
          variantId: variant.id,
          name: variant.name,
          script: script,
          hook: results.hook,
          segments: results.segments,
          hashtags: results.hashtags,
          variant: variant,
          images: images.map(i => i.url),
          sizeMB: "N/A",
          durationMs: variant.targetDurationMs || 30000,
        });
      }

      addToHistory({ id: Date.now(), script: script.slice(0, 60), variants: variants.length, createdAt: new Date().toISOString() });
      setPipeline("done", "Vidéos prêtes !", 100);

    } catch (err) {
      console.error("Pipeline error:", err);
      setPipeline("error", `Erreur : ${err?.message || JSON.stringify(err) || "inconnue"}`, 0);
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>✨ Nouveau projet</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Colle ton script et ajoute des images — les agents IA s'occupent du reste.</p>
      </div>

      <div className="card section">
        <label>Script TikTok</label>
        <textarea rows={6} value={script} onChange={e => setScript(e.target.value)}
          placeholder="Colle ton script ici... Ex: 'T'as peur de perdre ton argent en achat-revente ? Voici comment ReStock te garantit 1000€ en 3 mois...'" />
        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{script.length} caractères</div>
      </div>

      <div className="card section">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label>Images (optionnel, max 10)</label>
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>+ Ajouter</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleImages} />
        {images.length === 0 ? (
          <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", color: "var(--text3)" }}>
            📷 Clique pour ajouter des images
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={img.url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                <div onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, background: "#EF4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "white" }}>×</div>
              </div>
            ))}
            {images.length < 10 && (
              <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, border: "2px dashed var(--border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text3)", fontSize: 24 }}>+</div>
            )}
          </div>
        )}
      </div>

      {error && <div style={{ background: "var(--red-bg)", color: "var(--red)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>⚠️ {error}</div>}

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 14, fontSize: 15 }} onClick={handleSubmit} disabled={!script.trim()}>
        🚀 Lancer les agents IA
      </button>
    </div>
  );
}
