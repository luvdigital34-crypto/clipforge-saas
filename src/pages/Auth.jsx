import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { signIn } from "../utils/supabase.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { init } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    setLoading(true); setError("");
    try {
      await signIn(email.trim(), password);
      await init();
      navigate("/");
    } catch (err) {
      setError("Identifiants incorrects ou accès non autorisé.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28, margin: "0 auto 16px",
            boxShadow: "0 0 30px rgba(59,130,246,0.4)"
          }}>🎬</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#F0F0FF" }}>ClipForge AI</div>
          <div style={{ fontSize: 14, color: "#9090B0", marginTop: 4 }}>Accès réservé aux membres</div>
        </div>

        {/* Formulaire */}
        <div style={{
          background: "#111118", border: "1px solid #2A2A3A",
          borderRadius: 16, padding: "32px 28px"
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#F0F0FF", marginBottom: 24 }}>
            Connexion
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#9090B0", display: "block", marginBottom: 6 }}>
                EMAIL
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com" autoComplete="email"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#1A1A24", border: "1px solid #2A2A3A",
                  borderRadius: 8, color: "#F0F0FF", fontSize: 14,
                  outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#9090B0", display: "block", marginBottom: 6 }}>
                MOT DE PASSE
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#1A1A24", border: "1px solid #2A2A3A",
                  borderRadius: 8, color: "#F0F0FF", fontSize: 14,
                  outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#2A0F0F", border: "1px solid #5A1A1A",
                borderRadius: 8, padding: "10px 14px",
                color: "#F87171", fontSize: 13, marginBottom: 16
              }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "#1A2A4A" : "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              border: "none", borderRadius: 8, color: "white",
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 20px rgba(59,130,246,0.3)"
            }}>
              {loading ? "⏳ Connexion..." : "Se connecter"}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: "14px", background: "#0D1B2A", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#9090B0", textAlign: "center" }}>
              🔒 Accès sur invitation uniquement<br/>
              <span style={{ color: "#60A5FA" }}>Contacte l'administrateur pour obtenir un accès</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
