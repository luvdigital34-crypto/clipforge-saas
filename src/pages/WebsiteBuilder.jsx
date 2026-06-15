import React, { useState, useRef } from "react";
import { callClaude } from "../utils/api.js";

const SITE_TYPES = [
  { id: "vitrine", label: "Site vitrine", emoji: "🏪", desc: "Présentation de ton business" },
  { id: "landing", label: "Landing page", emoji: "🚀", desc: "Vente d'un produit ou service" },
  { id: "ecommerce", label: "Boutique", emoji: "🛍️", desc: "E-commerce simple avec panier" },
  { id: "blog", label: "Blog", emoji: "✍️", desc: "Articles et contenu" },
  { id: "portfolio", label: "Portfolio", emoji: "🎨", desc: "Présentation de tes créations" },
  { id: "resell", label: "Resell", emoji: "👟", desc: "Boutique sneakers / luxe / mode" },
];

const THEMES = [
  { id: "dark", label: "Dark Premium", colors: ["#0A0A0F", "#1A1A2E", "#3B82F6"] },
  { id: "light", label: "Blanc Minimaliste", colors: ["#FFFFFF", "#F8F8F8", "#1A1A1A"] },
  { id: "luxury", label: "Luxe Gold", colors: ["#0D0D0D", "#1A1A0A", "#C9A227"] },
  { id: "urban", label: "Urban Street", colors: ["#111111", "#222222", "#FF4444"] },
  { id: "nature", label: "Nature", colors: ["#F0F4F0", "#E8F5E9", "#2E7D32"] },
];

const SYSTEM_PROMPT = `Tu es un expert développeur web full-stack. Tu génères du code HTML/CSS/JS complet, moderne et professionnel en une seule page.

RÈGLES ABSOLUES :
- Génère UNIQUEMENT du code HTML complet (de <!DOCTYPE html> à </html>)
- CSS intégré dans <style>, JS intégré dans <script>
- Design moderne, responsive mobile, animations CSS
- Aucun texte avant ou après le code HTML
- Police Google Fonts via CDN
- Images via placeholder ou unsplash
- Le site doit être directement utilisable sans modification`;

export default function WebsiteBuilder() {
  const [siteType, setSiteType] = useState("");
  const [theme, setTheme] = useState("dark");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState([]);
  const [contactEmail, setContactEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=config, 2=preview
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  const FEATURE_OPTIONS = [
    "Formulaire de contact", "Bouton WhatsApp", "Galerie photos",
    "Section témoignages", "FAQ", "Compteur de stats",
    "Newsletter", "Chat live", "Carte Google Maps",
    "Section prix/tarifs", "Bouton paiement", "Portfolio produits",
  ];

  const toggleFeature = (f) => setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const generate = async () => {
    if (!siteType || !businessName.trim()) {
      alert("Choisis un type de site et entre le nom de ton business !");
      return;
    }
    setLoading(true);
    try {
      const selectedTheme = THEMES.find(t => t.id === theme);
      const prompt = `Crée un site web complet pour :
- Type : ${SITE_TYPES.find(s => s.id === siteType)?.label}
- Nom du business : ${businessName}
- Description : ${description || "Business professionnel"}
- Thème visuel : ${selectedTheme?.label} (couleurs principales : ${selectedTheme?.colors.join(", ")})
- Fonctionnalités incluses : ${features.length ? features.join(", ") : "basiques"}
- Email de contact : ${contactEmail || "contact@business.com"}

Génère un site complet, moderne, avec animations CSS, responsive mobile. Inclus du contenu réaliste adapté au business.`;

      const code = await callClaude({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
      });

      setGeneratedCode(code);
      setStep(2);

      // Inject into iframe
      setTimeout(() => {
        if (iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          doc.open();
          doc.write(code);
          doc.close();
        }
      }, 100);
    } catch (err) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName.replace(/\s+/g, "-").toLowerCase()}-site.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deployToNetlify = () => {
    // Crée un lien vers Netlify Drop pour héberger le fichier
    window.open("https://app.netlify.com/drop", "_blank");
    alert("1. Netlify va s'ouvrir\n2. Télécharge d'abord le fichier HTML\n3. Glisse-dépose le fichier HTML sur la zone Netlify\n4. Ton site est en ligne en 30 secondes !");
  };

  const regenerate = () => {
    setStep(1);
    setGeneratedCode("");
  };

  if (step === 2 && generatedCode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)" }}>
        {/* Topbar */}
        <div style={{ padding: "10px 20px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button className="btn btn-sm" onClick={regenerate}>← Modifier</button>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>✅ {businessName} — Site généré !</div>
          <button className="btn btn-sm" onClick={copyCode}>{copied ? "✓ Copié !" : "📋 Code"}</button>
          <button className="btn btn-sm btn-primary" onClick={download}>⬇️ Télécharger HTML</button>
          <button className="btn btn-sm" style={{ background: "#06B6D4", color: "white", border: "none" }} onClick={deployToNetlify}>🌐 Héberger gratuitement</button>
        </div>

        {/* Preview iframe */}
        <iframe
          ref={iframeRef}
          style={{ flex: 1, border: "none", width: "100%" }}
          title="Site preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🌐 Créateur de site web IA</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Décris ton business, l'IA crée ton site complet en 30 secondes — téléchargeable ou hébergeable directement.</p>
      </div>

      {/* Type de site */}
      <div className="section">
        <div className="section-title">Type de site</div>
        <div className="grid-3">
          {SITE_TYPES.map(s => (
            <div key={s.id} onClick={() => setSiteType(s.id)} style={{
              border: `1px solid ${siteType === s.id ? "#3B82F6" : "var(--border)"}`,
              background: siteType === s.id ? "var(--blue-bg)" : "var(--bg2)",
              borderRadius: 10, padding: "12px 10px", cursor: "pointer",
              boxShadow: siteType === s.id ? "0 0 12px rgba(59,130,246,0.2)" : "none",
              transition: "all .15s", textAlign: "center"
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: siteType === s.id ? "#60A5FA" : "var(--text)" }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Thème */}
      <div className="section">
        <div className="section-title">Thème visuel</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
              borderRadius: 20, border: `1px solid ${theme === t.id ? "#3B82F6" : "var(--border)"}`,
              background: theme === t.id ? "var(--blue-bg)" : "var(--bg2)",
              color: theme === t.id ? "#60A5FA" : "var(--text2)", fontSize: 12, cursor: "pointer"
            }}>
              {t.colors.map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />)}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Infos business */}
      <div className="card section">
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Nom du business *</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ex: LuxeResell, SneakersHub..." />
          </div>
          <div>
            <label>Email de contact</label>
            <input type="text" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@monbusiness.com" />
          </div>
        </div>
        <div>
          <label>Description de ton business</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Boutique de resell sneakers premium, spécialisée Nike et Jordan. On propose des articles authentifiés, livraison rapide, paiement sécurisé..."
          />
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="section">
        <div className="section-title">Fonctionnalités à inclure</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FEATURE_OPTIONS.map(f => (
            <button key={f} onClick={() => toggleFeature(f)} style={{
              padding: "5px 11px", borderRadius: 16,
              border: `1px solid ${features.includes(f) ? "#3B82F6" : "var(--border)"}`,
              background: features.includes(f) ? "var(--blue-bg)" : "var(--bg2)",
              color: features.includes(f) ? "#60A5FA" : "var(--text2)",
              fontSize: 11, cursor: "pointer"
            }}>
              {features.includes(f) ? "✓ " : ""}{f}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 15 }}
        onClick={generate}
        disabled={loading || !siteType || !businessName.trim()}
      >
        {loading ? "⏳ Génération du site en cours..." : "🌐 Créer mon site web"}
      </button>

      {loading && (
        <div style={{ textAlign: "center", marginTop: 16, color: "var(--text2)", fontSize: 13 }}>
          L'IA génère ton site complet... ça prend 15-30 secondes ⏳
        </div>
      )}
    </div>
  );
}
