import React, { useState } from "react";
import { useAuthStore } from "../store/authStore.js";
import { savePendingPayment, upgradePlan } from "../utils/supabase.js";

const YOUR_USDC_ADDRESS = "0xTON_ADRESSE_USDC_ICI";
const USDC_NETWORK = "Polygon (MATIC)";

const PLANS = [
  {
    id: "free", name: "Gratuit", monthly: 0, yearly: 0, currency: "",
    color: "#111118", textColor: "#F0F0FF", borderColor: "var(--border)",
    features: ["5 vidéos TikTok", "Assistant IA", "Noteur de produit", "Tendances basiques", "Générateur d'annonces"],
    cta: "Plan actuel", disabled: true,
  },
  {
    id: "pro", name: "Pro", monthly: 19, yearly: 200, currency: "USDC",
    color: "#1A1A1A", textColor: "#FFFFFF", borderColor: "#3B82F6",
    badge: "Populaire",
    features: ["1 000 vidéos/mois", "Tous les modules IA", "Authentification produit", "Analyse de marché avancée", "Réponses clients IA", "Fiches produits e-commerce", "Générateur de pubs", "Support prioritaire"],
    cta: "Passer en Pro",
  },
  {
    id: "premium", name: "Premium", monthly: 29, yearly: 300, currency: "USDC",
    color: "linear-gradient(135deg, #1E1B4B, #312E81)", textColor: "#FFFFFF", borderColor: "#818CF8",
    badge: "⭐ Premium",
    features: ["Vidéos illimitées", "Tous les modules Pro", "Coaching IA illimité", "Analyses marché illimitées", "Export comptable", "API access", "Support VIP 24/7", "Nouvelles features en avant-première"],
    cta: "Passer Premium",
  },
];

export default function Pricing() {
  const { user, profile, setProfile } = useAuthStore();
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState("plans");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPrice = (plan) => billing === "yearly" ? plan.yearly : plan.monthly;
  const getSaving = (plan) => plan.monthly > 0 ? Math.round(100 - (plan.yearly / (plan.monthly * 12)) * 100) : 0;

  const startPayment = (plan) => { setSelectedPlan(plan); setStep("payment"); };

  const copyAddress = () => navigator.clipboard.writeText(YOUR_USDC_ADDRESS);

  const confirmPayment = async () => {
    if (!txHash.trim()) return;
    setLoading(true);
    try {
      await savePendingPayment(user.id, selectedPlan.id, txHash.trim());
      await upgradePlan(user.id, selectedPlan.id);
      setProfile({ ...profile, plan: selectedPlan.id, videos_limit: selectedPlan.id === "pro" ? 999 : 999999 });
      setSuccess(true); setStep("confirm");
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setLoading(false); }
  };

  if (step === "confirm" && success) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", maxWidth: 440, margin: "40px auto" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Plan {selectedPlan.name} activé !</div>
          <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>Bienvenue dans le {selectedPlan.name} !</div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setStep("plans")}>Retour aux plans</button>
        </div>
      </div>
    );
  }

  if (step === "payment" && selectedPlan) {
    const price = getPrice(selectedPlan);
    return (
      <div className="page-content">
        <button className="btn btn-sm" style={{ marginBottom: 20 }} onClick={() => setStep("plans")}>← Retour</button>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Paiement — Plan {selectedPlan.name}</h1>
          <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 24 }}>
            Envoie exactement <strong style={{ color: "white" }}>{price} USDC</strong> sur le réseau <strong style={{ color: "white" }}>{USDC_NETWORK}</strong>
          </p>

          <div className="card" style={{ textAlign: "center", marginBottom: 14, background: "#1E2A4A", borderColor: "#2A3A5A" }}>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>Montant exact</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#60A5FA" }}>{price} USDC</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Réseau : {USDC_NETWORK} · {billing === "yearly" ? "Annuel" : "Mensuel"}</div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Adresse USDC</div>
            <div style={{ background: "#0A0A0F", borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", marginBottom: 8 }}>
              {YOUR_USDC_ADDRESS}
            </div>
            <button className="btn" style={{ width: "100%" }} onClick={copyAddress}>📋 Copier l'adresse</button>
          </div>

          <div className="card" style={{ marginBottom: 16, fontSize: 13, color: "var(--text2)", lineHeight: 2 }}>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Comment payer :</div>
            <div>1. Ouvre MetaMask / Trust Wallet</div>
            <div>2. Envoie <strong>{price} USDC</strong> sur Polygon</div>
            <div>3. Copie le hash de transaction</div>
            <div>4. Colle-le ci-dessous et confirme</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label>Hash de transaction (TX Hash)</label>
            <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", padding: 12, opacity: txHash.trim() ? 1 : 0.5 }} onClick={confirmPayment} disabled={loading || !txHash.trim()}>
            {loading ? "Vérification..." : "✓ Confirmer le paiement"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>💎 Plans & Tarifs</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Paiement en USDC · Réseau Polygon · Sans abonnement bancaire</p>
      </div>

      {/* Toggle mensuel/annuel */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={() => setBilling("monthly")} style={{ padding: "8px 20px", borderRadius: 20, border: `1px solid ${billing === "monthly" ? "#3B82F6" : "var(--border)"}`, background: billing === "monthly" ? "#1E2A4A" : "#111118", color: billing === "monthly" ? "#60A5FA" : "var(--text2)", fontSize: 14, cursor: "pointer", fontWeight: billing === "monthly" ? 600 : 400 }}>
          Mensuel
        </button>
        <button onClick={() => setBilling("yearly")} style={{ padding: "8px 20px", borderRadius: 20, border: `1px solid ${billing === "yearly" ? "#818CF8" : "var(--border)"}`, background: billing === "yearly" ? "#1E1B4B" : "#111118", color: billing === "yearly" ? "#818CF8" : "var(--text2)", fontSize: 14, cursor: "pointer", fontWeight: billing === "yearly" ? 600 : 400 }}>
          Annuel 🎁
        </button>
        {billing === "yearly" && <span style={{ fontSize: 12, background: "#0F2A1A", color: "#4ADE80", padding: "3px 10px", borderRadius: 20 }}>Économise jusqu'à 42%</span>}
      </div>

      {profile && (
        <div style={{ background: "#0F2A1A", color: "#4ADE80", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, marginBottom: 24, display: "inline-block" }}>
          ✓ Plan actuel : {profile.plan === "free" ? "Gratuit" : profile.plan === "pro" ? "Pro" : "Premium"}
          {profile.plan === "free" && ` — ${Math.max(0, profile.videos_limit - profile.videos_used)} vidéos restantes`}
        </div>
      )}

      <div className="grid-3">
        {PLANS.map((plan) => {
          const price = getPrice(plan);
          const saving = getSaving(plan);
          const isCurrent = profile?.plan === plan.id || (profile?.plan === "unlimited" && plan.id === "premium");
          return (
            <div key={plan.id} style={{
              background: plan.color, borderRadius: 16, padding: "24px 20px",
              border: `1px solid ${isCurrent ? "#4ADE80" : plan.borderColor}`,
              boxShadow: isCurrent ? "0 0 20px rgba(74,222,128,0.15)" : plan.borderColor !== "var(--border)" ? `0 0 20px ${plan.borderColor}22` : "none",
              position: "relative",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.id === "premium" ? "#818CF8" : "#3B82F6", color: "white", fontSize: 11, fontWeight: 600, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ color: plan.textColor }}>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{plan.name}</div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 700 }}>{price === 0 ? "Gratuit" : price}</span>
                  {price > 0 && <span style={{ fontSize: 13, opacity: 0.7 }}> USDC/{billing === "yearly" ? "an" : "mois"}</span>}
                </div>
                {billing === "yearly" && saving > 0 && (
                  <div style={{ fontSize: 12, color: "#4ADE80", marginBottom: 14 }}>🎁 -{saving}% vs mensuel</div>
                )}
                {billing === "monthly" && plan.yearly > 0 && (
                  <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>ou {plan.yearly} USDC/an</div>
                )}

                <div style={{ marginBottom: 20 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ fontSize: 12, marginBottom: 7, opacity: 0.9, display: "flex", gap: 6 }}>
                      <span style={{ color: "#4ADE80" }}>✓</span> {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !plan.disabled && !isCurrent && startPayment(plan)}
                  disabled={plan.disabled || isCurrent}
                  style={{
                    width: "100%", padding: "10px", borderRadius: 10,
                    border: `1px solid ${plan.id === "premium" ? "#818CF8" : "rgba(255,255,255,0.2)"}`,
                    background: isCurrent ? "rgba(74,222,128,0.2)" : plan.id === "premium" ? "rgba(129,140,248,0.3)" : "rgba(59,130,246,0.3)",
                    color: "white", fontWeight: 600, fontSize: 13,
                    cursor: plan.disabled || isCurrent ? "default" : "pointer",
                    opacity: plan.disabled || isCurrent ? 0.7 : 1,
                  }}
                >
                  {isCurrent ? "✓ Plan actuel" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "var(--text3)", textAlign: "center" }}>
        💡 Paiement USDC sur Polygon — frais &lt;0.01$ · Aucun remboursement · Accès immédiat après confirmation
      </div>
    </div>
  );
}
