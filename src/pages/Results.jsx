import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";
import { renderVideoFromData } from "../utils/canvasRenderer.js";

export default function Results() {
  const { agentResults, renderResults, selectedVariant, setSelectedVariant } = useStore();
  const navigate = useNavigate();
  const [rendering, setRendering] = useState({});
  const [videoUrls, setVideoUrls] = useState({});

  const variants = agentResults?.variants || [];
  const selected = selectedVariant || variants[0]?.id;

  if (!agentResults || variants.length === 0) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Aucune variante générée</div>
          <button className="btn btn-primary" onClick={() => navigate("/create")}>← Créer un projet</button>
        </div>
      </div>
    );
  }

  const renderVideo = async (variant) => {
    if (rendering[variant.id] || videoUrls[variant.id]) return;
    setRendering(prev => ({ ...prev, [variant.id]: true }));

    try {
      const result = await renderVideoFromData({
        variant,
        hook: agentResults.hook,
        segments: agentResults.segments,
        hashtags: agentResults.hashtags,
        images: renderResults[variant.id]?.images || [],
        script: renderResults[variant.id]?.script || "",
      });

      setVideoUrls(prev => ({ ...prev, [variant.id]: result.url }));
    } catch (err) {
      alert("Erreur rendu : " + err.message);
    } finally {
      setRendering(prev => ({ ...prev, [variant.id]: false }));
    }
  };

  const downloadVideo = (variantId, name) => {
    const url = videoUrls[variantId];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipforge-${name.replace(/\s+/g, "-").toLowerCase()}.webm`;
    a.click();
  };

  const selectedResult = renderResults[selected];
  const selectedVariantData = variants.find(v => v.id === selected);

  const COLORS = {
    fast: { bg: "#0D1B2A", accent: "#3B82F6" },
    medium: { bg: "#1A0D00", accent: "#F97316" },
    slow: { bg: "#0D1A0D", accent: "#22C55E" },
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎬 Résultats</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>{variants.length} variantes générées · Prêtes à exporter</p>
      </div>

      {/* Prévisualisation */}
      {selected && selectedVariantData && (
        <div className="card section">
          <div className="section-title">Prévisualisation — {selectedVariantData.name?.toUpperCase()}</div>
          
          {videoUrls[selected] ? (
            <>
              <video controls style={{ width: "100%", borderRadius: 10, maxHeight: 400 }} src={videoUrls[selected]} />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => downloadVideo(selected, selectedVariantData.name)}>
                  ⬇️ Télécharger WebM
                </button>
                <button className="btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => renderVideo(selectedVariantData)}>
                  🔄 Regénérer
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: "var(--bg3)", borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Vidéo prête à générer</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                Hook : "{agentResults.hook?.hookText}"<br/>
                Durée : {Math.round((selectedVariantData.targetDurationMs || 30000) / 1000)}s · Style : {selectedVariantData.pace}
              </div>
              <button className="btn btn-primary" style={{ justifyContent: "center", padding: "12px 32px" }}
                onClick={() => renderVideo(selectedVariantData)} disabled={rendering[selected]}>
                {rendering[selected] ? "⏳ Génération vidéo en cours..." : "▶ Générer la vidéo"}
              </button>
              {rendering[selected] && (
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
                  Patiente 10-30 secondes selon la durée...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Variantes */}
      <div className="section">
        <div className="section-title">Variantes</div>
        <div className="grid-3">
          {variants.map(v => {
            const colors = COLORS[v.pace] || COLORS.fast;
            const hasVideo = !!videoUrls[v.id];
            const isRendering = rendering[v.id];
            return (
              <div key={v.id} onClick={() => setSelectedVariant(v.id)} style={{
                border: `2px solid ${selected === v.id ? "#3B82F6" : "var(--border)"}`,
                borderRadius: 12, cursor: "pointer", overflow: "hidden",
                boxShadow: selected === v.id ? "0 0 16px rgba(59,130,246,0.3)" : "none",
                transition: "all .15s", background: "var(--bg2)"
              }}>
                <div style={{ height: 90, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {hasVideo ? (
                    <div style={{ fontSize: 28 }}>✅</div>
                  ) : isRendering ? (
                    <div style={{ fontSize: 12, color: colors.accent }}>⏳ En cours...</div>
                  ) : (
                    <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</div>
                  )}
                  <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                    {Math.round((v.targetDurationMs || 30000) / 1000)}s
                  </div>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{v.description}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, background: colors.bg, color: colors.accent, padding: "2px 6px", borderRadius: 6 }}>{v.pace}</span>
                    {v.colorFilter && <span style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text3)", padding: "2px 6px", borderRadius: 6 }}>{v.colorFilter}</span>}
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", marginTop: 8, padding: "6px", fontSize: 11, justifyContent: "center" }}
                    onClick={e => { e.stopPropagation(); hasVideo ? downloadVideo(v.id, v.name) : renderVideo(v); }}>
                    {hasVideo ? "⬇️ Télécharger" : isRendering ? "⏳..." : "▶ Générer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hook + Hashtags */}
      {agentResults.hook && (
        <div className="card section">
          <div className="section-title">Hook — {agentResults.hook.hookDuration / 1000}s</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)", marginBottom: 4 }}>
            "{agentResults.hook.hookText}"
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>
            Style : {agentResults.hook.hookStyle} · Son : {agentResults.hook.soundSuggestion}
          </div>
        </div>
      )}

      {agentResults.hashtags && (
        <div className="card section">
          <div className="section-title">Hashtags & légende</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {agentResults.hashtags.viral?.map(h => <span key={h} className="tag tag-viral">{h}</span>)}
            {agentResults.hashtags.trending?.map(h => <span key={h} className="tag tag-trending">{h}</span>)}
            {agentResults.hashtags.niche?.map(h => <span key={h} className="tag">{h}</span>)}
          </div>
          {agentResults.hashtags.caption && (
            <div style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
              {agentResults.hashtags.caption}
            </div>
          )}
        </div>
      )}

      <button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/create")}>
        ← Nouveau projet
      </button>
    </div>
  );
}
