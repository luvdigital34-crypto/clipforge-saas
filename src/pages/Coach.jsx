import { callClaude, getApiKey } from "../utils/api.js";
import React, { useState } from "react";

const PROFILES = [
  { id: "resell_marketplace", label: "Revendeur Marketplace", icon: "🛍️", desc: "Vinted, Vestiaire, eBay, Chrono24" },
  { id: "resell_site", label: "Revendeur Site/Boutique", icon: "🏪", desc: "Site web, boutique physique ou en ligne" },
  { id: "tiktok_creator", label: "Créateur TikTok", icon: "🎬", desc: "Contenu, personal branding, monétisation" },
  { id: "developer", label: "Développeur / Tech", icon: "💻", desc: "Apps, SaaS, automatisation" },
];

const SYSTEM = `Tu es un coach business IA expert. Selon le profil de l'utilisateur, tu génères un coaching personnalisé avec des tâches prioritaires concrètes pour cette semaine.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "greeting": "message d'accueil personnalisé motivant",
  "weekly_focus": "objectif principal de la semaine",
  "priority_tasks": [
    { "title": "titre tâche", "description": "description concrète", "time": "30 min", "impact": "haute", "category": "revenus" }
  ],
  "opportunities": [
    { "title": "opportunité", "description": "comment en profiter", "potential": "500€/mois" }
  ],
  "recommendations": ["recommandation concrète 1", "recommandation 2"],
  "avoid": ["erreur à éviter 1", "erreur 2"],
  "motivation": "message motivant personnalisé"
}`;

export default function Coach() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [context, setContext] = useState("");
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);

  const getApiKey = () => {
    try { return JSON.parse(localStorage.getItem("clipforge-storage"))?.state?.apiKey; } catch { return null; }
  };

  const getCoaching = async () => {
    if (!selectedProfile) return;
    setLoading(true); setCoaching(null);
    try {
      const profile = PROFILES.find(p => p.id === selectedProfile);
      const text = await callClaude({
        system: SYSTEM,
        messages: [{ role: "user", content: `Profil : ${profile.label}. Contexte actuel : ${context || "débutant qui veut progresser"}. Génère un coaching personnalisé pour cette semaine avec des actions concrètes et réalisables.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
      });
      setCoaching(JSON.parse(text.replace(/```json|```/g, "").trim() || "{}"));
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const IMPACT_STYLE = {
    haute: { bg: "#EAF3DE", color: "#27500A" },
    moyenne: { bg: "#FAEEDA", color: "#633806" },
    faible: { bg: "var(--bg3)", color: "var(--text2)" }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎯 Coach IA personnalisé</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Choisis ton profil et reçois un coaching sur-mesure avec tes tâches prioritaires de la semaine.</p>
      </div>

      {/* Choix du profil */}
      <div className="section">
        <div className="section-title">Ton profil</div>
        <div className="grid-2">
          {PROFILES.map(p => (
            <div key={p.id} onClick={() => setSelectedProfile(p.id)} style={{ border: `2px solid ${selectedProfile === p.id ? "#1A1A1A" : "var(--border)"}`, borderRadius: 12, padding: "16px", cursor: "pointer", background: selectedProfile === p.id ? "#3B82F6" : "#111118", transition: "all .15s" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{p.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{p.label}</div>
              <div style={{ fontSize: 12, color: selectedProfile === p.id ? "rgba(255,255,255,0.7)" : "var(--text2)", marginTop: 2 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card section">
        <label>Où tu en es actuellement ? (optionnel)</label>
        <textarea rows={2} value={context} onChange={e => setContext(e.target.value)} placeholder="Ex: J'ai vendu 3 articles ce mois, je cherche à passer à 20 ventes/mois..." style={{ marginBottom: 12 }} />
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={getCoaching} disabled={loading || !selectedProfile}>
          {loading ? "⏳ Génération du coaching..." : "🎯 Obtenir mon coaching"}
        </button>
      </div>

      {coaching && (
        <>
          {/* Accueil */}
          <div className="card section" style={{ background: "#1A1A1A", borderColor: "#1A1A1A" }}>
            <div style={{ color: "white", fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>{coaching.greeting}</div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              🎯 Focus de la semaine : <strong style={{ color: "white" }}>{coaching.weekly_focus}</strong>
            </div>
          </div>

          {/* Tâches prioritaires */}
          <div className="card section">
            <div className="section-title">✅ Tâches prioritaires cette semaine</div>
            {coaching.priority_tasks?.map((task, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < coaching.priority_tasks.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: IMPACT_STYLE[task.impact]?.bg, color: IMPACT_STYLE[task.impact]?.color }}>Impact {task.impact}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--bg3)", color: "var(--text2)" }}>⏱ {task.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{task.description}</div>
              </div>
            ))}
          </div>

          {/* Opportunités */}
          <div className="card section">
            <div className="section-title">💡 Opportunités du moment</div>
            {coaching.opportunities?.map((opp, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < coaching.opportunities.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{opp.title}</div>
                  <span style={{ fontSize: 12, background: "#EAF3DE", color: "#27500A", padding: "2px 8px", borderRadius: 20 }}>{opp.potential}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{opp.description}</div>
              </div>
            ))}
          </div>

          {/* À éviter */}
          <div className="grid-2 section">
            <div className="card">
              <div className="section-title">✅ Recommandations</div>
              {coaching.recommendations?.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: i < coaching.recommendations.length - 1 ? "1px solid var(--border)" : "none" }}>→ {r}</div>)}
            </div>
            <div className="card">
              <div className="section-title">🚫 Erreurs à éviter</div>
              {coaching.avoid?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "5px 0", borderBottom: i < coaching.avoid.length - 1 ? "1px solid var(--border)" : "none", color: "var(--red)" }}>✗ {a}</div>)}
            </div>
          </div>

          {/* Motivation */}
          <div className="card" style={{ textAlign: "center", padding: "20px", background: "var(--bg3)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💪</div>
            <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--text2)" }}>{coaching.motivation}</div>
          </div>
        </>
      )}
    </div>
  );
}
