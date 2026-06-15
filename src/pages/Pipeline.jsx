import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";

const AGENTS = [
  { key: "hook", label: "HookAgent", sub: "Accroche 2–3 secondes" },
  { key: "script", label: "ScriptAgent", sub: "Découpage & timing" },
  { key: "variants", label: "VariantAgent", sub: "3 variantes de montage" },
  { key: "hashtags", label: "HashtagAgent", sub: "Hashtags TikTok" },
];

export default function Pipeline() {
  const { pipeline, agentResults, renderResults } = useStore();
  const navigate = useNavigate();
  const isDone = pipeline.step === "done";
  const isError = pipeline.step === "error";

  useEffect(() => {
    if (isDone) {
      const t = setTimeout(() => navigate("/results"), 1800);
      return () => clearTimeout(t);
    }
  }, [isDone]);

  const agentsDone = agentResults !== null;
  const isRendering = pipeline.step === "rendering";

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Pipeline en cours</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>
          Les agents IA travaillent sur ta vidéo…
        </p>
      </div>

      {/* Progression globale */}
      <div className="card section">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{pipeline.message || "En attente..."}</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{pipeline.percent}%</span>
        </div>
        <div className="progress-track" style={{ height: 8 }}>
          <div
            className="progress-fill"
            style={{
              width: `${isDone ? 100 : pipeline.percent}%`,
              background: isDone ? "#34C759" : isError ? "#FF3B30" : "var(--accent)"
            }}
          />
        </div>
        {isDone && (
          <div style={{ color: "#27500A", fontSize: 13, marginTop: 8, fontWeight: 500 }}>
            🎉 Vidéos prêtes ! Redirection...
          </div>
        )}
        {isError && (
          <div style={{ color: "var(--red)", fontSize: 13, marginTop: 8 }}>
            {pipeline.message}
            <button className="btn btn-sm" style={{ marginLeft: 12 }} onClick={() => navigate("/create")}>
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Phase 1 — Agents */}
      <div className="card section">
        <div className="section-title">Phase 1 — Agents IA</div>
        {AGENTS.map((agent, i) => (
          <div key={agent.key} className="agent-row">
            <div className={`agent-dot ${agentsDone ? "done" : pipeline.step === "running_agents" ? "active" : "wait"}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{agent.sub}</div>
            </div>
            <span style={{ fontSize: 13, color: "var(--text3)" }}>
              {agentsDone ? "✓" : pipeline.step === "running_agents" ? "…" : "–"}
            </span>
          </div>
        ))}
      </div>

      {/* Hook généré */}
      {agentResults?.hook && (
        <div className="card section">
          <div className="section-title">Hook généré</div>
          <div className="hook-preview">
            <div className="hook-text">"{agentResults.hook.hookText}"</div>
            <div className="hook-meta">
              {(agentResults.hook.hookDuration / 1000).toFixed(1)}s · {agentResults.hook.hookStyle} · {agentResults.hook.soundSuggestion}
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 — Rendu */}
      {agentResults && (
        <div className="card section">
          <div className="section-title">Phase 2 — Rendu vidéo</div>
          {agentResults.variants?.map((v) => {
            const result = renderResults[v.id];
            return (
              <div key={v.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>
                    {result?.success ? `✓ ${result.sizeMB} MB` : result?.error ? "✗" : isRendering ? "…" : "–"}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: result?.success ? "100%" : "0%",
                      background: result?.success ? "#34C759" : "var(--accent)",
                      transition: "width .4s"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hashtags */}
      {agentResults?.hashtags && (
        <div className="card section">
          <div className="section-title">Hashtags générés</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agentResults.hashtags.viral?.map((h) => <span key={h} className="tag tag-viral">{h}</span>)}
            {agentResults.hashtags.trending?.map((h) => <span key={h} className="tag tag-trending">{h}</span>)}
            {agentResults.hashtags.niche?.map((h) => <span key={h} className="tag">{h}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
