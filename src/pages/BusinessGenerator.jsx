import { callClaude, getApiKey } from "../utils/api.js";
import React, { useState } from "react";

const SYSTEM = `Tu es un expert business et entrepreneur qui aide à lancer des projets rentables. Tu analyses le profil de l'utilisateur et génères un plan d'action concret et réaliste.

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "business_name": "nom suggéré",
  "concept": "description en 1 phrase",
  "verdict": "go" ou "attention" ou "stop",
  "verdict_reason": "pourquoi",
  "best_channel": "vinted" ou "site_web" ou "tiktok" ou "marketplace" ou "mixte",
  "best_channel_reason": "explication concrète",
  "monthly_potential": { "min": 500, "max": 2000, "realistic": 800 },
  "steps": [
    { "week": "Semaine 1-2", "title": "titre", "tasks": ["tâche 1", "tâche 2"], "priority": "haute" }
  ],
  "tools": [{ "name": "outil", "cost": "gratuit", "why": "pourquoi l'utiliser" }],
  "risks": ["risque 1", "risque 2"],
  "personal_branding": true,
  "personal_branding_tips": ["conseil 1", "conseil 2"],
  "quick_wins": ["action rapide 1 pour gagner de l'argent vite"]
}`;

export default function BusinessGenerator() {
  const [budget, setBudget] = useState("");
  const [skills, setSkills] = useState([]);
  const [project, setProject] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const SKILLS_LIST = ["Resell", "TikTok/Réseaux", "Développement web", "Design", "Marketing", "Dropshipping", "Luxe/Mode", "Sneakers", "High-tech", "Sport"];

  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const getApiKey = () => {
    try { return JSON.parse(localStorage.getItem("clipforge-storage"))?.state?.apiKey; } catch { return null; }
  };

  const generate = async () => {
    setLoading(true); setResult(null);
    try {
     const text = await callClaude({
        system: SYSTEM,
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [{ role: "user", content: `Budget : ${budget}€. Compétences : ${skills.join(", ")}. Projet : ${project}. Objectif : ${goal}€/mois. Réponds UNIQUEMENT avec le JSON demandé, sans texte avant ou après.` }]
      });
     const clean = text
        .replace(/```json|```/g, "")
        .replace(/[\x00-\x1F\x7F]/g, " ")
        .trim();
      const match = clean.match(/(\{[\s\S]*\})/);
      try {
        setResult(JSON.parse(match ? match[0] : clean));
      } catch {
        const fixed = (match ? match[0] : clean).replace(/[\x00-\x1F\x7F]/g, "");
        setResult(JSON.parse(fixed));
      }
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  const VERDICT = { go: { emoji: "🚀", label: "Feu vert !", color: "#27500A", bg: "#EAF3DE" }, attention: { emoji: "⚠️", label: "Avec précautions", color: "#633806", bg: "#FAEEDA" }, stop: { emoji: "🛑", label: "À reconsidérer", color: "#712B13", bg: "#FAECE7" } };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🚀 Générateur de business IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Décris ton projet, l'IA te donne un plan d'action concret et te dit si ça vaut le coup.</p>
      </div>

      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label>Budget disponible (€)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Ex: 500" />
          </div>
          <div>
            <label>Objectif mensuel (€)</label>
            <input type="number" value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ex: 1500" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Ton projet / idée</label>
          <textarea rows={3} value={project} onChange={e => setProject(e.target.value)} placeholder="Ex: Je veux revendre des sneakers Nike sur Vinted, j'ai un stock de 10 paires achetées entre 40 et 80€..." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Tes compétences</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {SKILLS_LIST.map(s => (
              <button key={s} onClick={() => toggleSkill(s)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${skills.includes(s) ? "#1A1A1A" : "var(--border)"}`, background: skills.includes(s) ? "#1A1A1A" : "white", color: skills.includes(s) ? "white" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={generate} disabled={loading || !project.trim()}>
          {loading ? "⏳ Génération du plan..." : "✨ Générer mon plan business"}
        </button>
      </div>

      {result && (
        <>
          {/* Verdict */}
          <div style={{ background: VERDICT[result.verdict]?.bg, borderRadius: 14, padding: "20px", marginBottom: 16, border: `1px solid ${VERDICT[result.verdict]?.color}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 36 }}>{VERDICT[result.verdict]?.emoji}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: VERDICT[result.verdict]?.color }}>{VERDICT[result.verdict]?.label} — {result.business_name}</div>
                <div style={{ fontSize: 13, color: VERDICT[result.verdict]?.color, marginTop: 2 }}>{result.verdict_reason}</div>
              </div>
            </div>
          </div>

          {/* Potentiel + Meilleur canal */}
          <div className="grid-2 section">
            <div className="card">
              <div className="section-title">💰 Potentiel mensuel</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{result.monthly_potential?.realistic}€</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{result.monthly_potential?.min}€ min — {result.monthly_potential?.max}€ max</div>
            </div>
            <div className="card">
              <div className="section-title">📣 Meilleur canal</div>
              <div style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize" }}>{result.best_channel?.replace("_", " ")}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{result.best_channel_reason}</div>
            </div>
          </div>

          {/* Quick wins */}
          {result.quick_wins?.length > 0 && (
            <div className="card section" style={{ background: "#E6F1FB", borderColor: "#B5D4F4" }}>
              <div style={{ fontWeight: 700, color: "#0C447C", marginBottom: 8 }}>⚡ Actions rapides pour gagner de l'argent vite</div>
              {result.quick_wins.map((w, i) => <div key={i} style={{ fontSize: 13, color: "#0C447C", marginBottom: 4 }}>→ {w}</div>)}
            </div>
          )}

          {/* Plan d'action */}
          <div className="card section">
            <div className="section-title">📅 Plan d'action semaine par semaine</div>
            {result.steps?.map((step, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < result.steps.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: step.priority === "haute" ? "#EAF3DE" : "var(--bg3)", color: step.priority === "haute" ? "#27500A" : "var(--text2)", padding: "2px 8px", borderRadius: 20 }}>{step.week}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{step.title}</span>
                </div>
                {step.tasks.map((t, j) => <div key={j} style={{ fontSize: 12, color: "var(--text2)", paddingLeft: 16, marginBottom: 3 }}>✓ {t}</div>)}
              </div>
            ))}
          </div>

          {/* Outils */}
          <div className="card section">
            <div className="section-title">🛠️ Outils recommandés</div>
            {result.tools?.map((tool, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < result.tools.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{tool.name}</span>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{tool.why}</div>
                </div>
                <span style={{ fontSize: 11, background: tool.cost === "gratuit" ? "#EAF3DE" : "var(--bg3)", color: tool.cost === "gratuit" ? "#27500A" : "var(--text2)", padding: "2px 8px", borderRadius: 20 }}>{tool.cost}</span>
              </div>
            ))}
          </div>

          {/* Personal branding */}
          {result.personal_branding && (
            <div className="card section">
              <div className="section-title">📱 Personal branding recommandé</div>
              {result.personal_branding_tips?.map((tip, i) => (
                <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: i < result.personal_branding_tips.length - 1 ? "1px solid var(--border)" : "none" }}>💡 {tip}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
