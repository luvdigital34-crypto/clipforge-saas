import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";

export default function History() {
  const { history } = useStore();
  const navigate = useNavigate();

  if (history.length === 0) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🕒</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun historique</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate("/create")}>
            Créer un projet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Historique</h1>
        <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>{history.length} projets</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {history.map((p) => (
          <div key={p.id} className="card card-sm" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {p.script?.slice(0, 80)}...
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>
                {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </div>
            </div>
            <span className="badge badge-green">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}
