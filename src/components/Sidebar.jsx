import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useStore } from "../store/store.js";
import { useAuthStore } from "../store/authStore.js";
import { signOut } from "../utils/supabase.js";

export default function Sidebar() {
  const { history, pipeline } = useStore();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [resellOpen, setResellOpen] = useState(true);
  const [ecomOpen, setEcomOpen] = useState(true);
  const [tiktokOpen, setTiktokOpen] = useState(true);
  const isRunning = pipeline.step === "running_agents" || pipeline.step === "rendering";

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };
  const planLabel = { free: "Gratuit", pro: "Pro", unlimited: "Illimité" };
  const planColor = { free: "#9090B0", pro: "#60A5FA", unlimited: "#4ADE80" };

  const NavItem = ({ to, icon, label, badge }) => (
    <NavLink to={to} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
      {icon} {label}
      {badge && <span className="nav-badge" style={{ marginLeft: "auto" }}>{badge}</span>}
    </NavLink>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎬</div>
        <span className="logo-text">ClipForge AI</span>
        <span className="logo-badge">beta</span>
      </div>

      <nav className="nav" style={{ overflowY: "auto", flex: 1 }}>
        <NavItem to="/" icon="🏠" label="Dashboard" />
        <NavItem to="/assistant" icon="🤖" label="Assistant IA" />
        <NavItem to="/coach" icon="🎯" label="Coach IA" />
        <NavItem to="/revenue" icon="💰" label="Revenus & Compta" />
        <NavItem to="/stock" icon="📦" label="Gestion du stock" />

        <div className="nav-section" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setResellOpen(o => !o)}>
          Resell {resellOpen ? "▾" : "▸"}
        </div>
        {resellOpen && <>
          <NavItem to="/scorer" icon="🎯" label="Noteur de produit" />
          <NavItem to="/trends" icon="📈" label="Tendances" />
          <NavItem to="/market" icon="📊" label="Analyse de marché" />
          <NavItem to="/listing" icon="📝" label="Annonces" />
          <NavItem to="/responder" icon="💬" label="Réponses clients" />
          <NavItem to="/business" icon="🚀" label="Générateur business" />
        </>}

        <div className="nav-section" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setEcomOpen(o => !o)}>
          E-commerce {ecomOpen ? "▾" : "▸"}
        </div>
        {ecomOpen && <>
          <NavItem to="/sheets" icon="🛍️" label="Fiches produits" />
          <NavItem to="/ads" icon="📣" label="Générateur de pubs" />
          <NavItem to="/reviews" icon="⭐" label="Gestion des avis" />
          <NavItem to="/auth-product" icon="🔍" label="Authentification" />
          <NavItem to="/shopify" icon="🛒" label="Shopify Manager" />
          <NavItem to="/website-builder" icon="🌐" label="Créateur de site" />
        </>}

        <div className="nav-section" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setTiktokOpen(o => !o)}>
          TikTok {tiktokOpen ? "▾" : "▸"}
        </div>
        {tiktokOpen && <>
          <NavItem to="/images" icon="🎨" label="Générer des images" />
          <NavItem to="/studio-3d" icon="🎬" label="Studio 3D" />
          <NavItem to="/model-3d" icon="🧊" label="Modèles 3D" />
          <NavItem to="/tiktok-audit" icon="📱" label="Audit TikTok" />
          <NavItem to="/create" icon="✨" label="Créer une vidéo" />
          {isRunning && <NavItem to="/pipeline" icon="⚡" label="Pipeline" badge={`${pipeline.percent}%`} />}
          <NavItem to="/results" icon="🎬" label="Résultats" />
        </>}

        <div className="nav-section">Compte</div>
        <NavLink to="/pricing" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
          💎 Plans & Tarifs
          {profile?.plan === "free" && <span style={{ marginLeft:"auto", fontSize:10, background:"#2A1F0A", color:"#FCD34D", padding:"1px 6px", borderRadius:8 }}>{Math.max(0, (profile?.videos_limit||5)-(profile?.videos_used||0))} vid.</span>}
        </NavLink>
        <NavItem to="/admin" icon="👑" label="Admin" />
        <NavItem to="/settings" icon="⚙️" label="Paramètres" />
        <NavItem to="/history" icon="🕒" label="Historique" badge={history.length > 0 ? history.length : null} />
      </nav>

      <div className="sidebar-footer">
        {profile && <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#F0F0FF" }}>{profile.email}</div>
          <div style={{ fontSize: 11, color: planColor[profile.plan] }}>Plan {planLabel[profile.plan]}</div>
        </div>}
        <button onClick={handleSignOut} style={{ fontSize: 12, color: "#9090B0", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Déconnexion →</button>
      </div>
    </aside>
  );
}
