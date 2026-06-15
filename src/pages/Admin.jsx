import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import { supabase } from "../utils/supabase.js";

const ADMIN_EMAIL = "luv.digital34@gmail.com"; // TON email admin

export default function Admin() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPlan, setNewPlan] = useState("pro");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = profile?.email === ADMIN_EMAIL;

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const createUser = async () => {
    if (!newEmail || !newPassword) { setError("Remplis email et mot de passe."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      // Crée l'utilisateur via Supabase Admin
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: newEmail.trim(),
        password: newPassword.trim(),
        options: { data: { plan: newPlan } }
      });
      if (signUpError) throw signUpError;

      // Met à jour le profil
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: newEmail.trim(),
          plan: newPlan,
          videos_used: 0,
          videos_limit: newPlan === "free" ? 5 : newPlan === "pro" ? 999 : 999999,
          created_at: new Date().toISOString()
        });
      }

      setMessage(`✅ Compte créé pour ${newEmail} — Plan ${newPlan}`);
      setNewEmail(""); setNewPassword("");
      loadUsers();
    } catch (err) {
      setError("Erreur : " + err.message);
    } finally { setLoading(false); }
  };

  const changePlan = async (userId, plan) => {
    await supabase.from("profiles").update({
      plan,
      videos_limit: plan === "free" ? 5 : plan === "pro" ? 999 : 999999
    }).eq("id", userId);
    loadUsers();
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Supprimer le compte de ${email} ?`)) return;
    await supabase.from("profiles").delete().eq("id", userId);
    loadUsers();
  };

  if (!isAdmin) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 700 }}>Accès refusé</div>
          <div style={{ color: "var(--text2)", marginTop: 8 }}>Réservé à l'administrateur.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>👑 Panneau Admin</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Gère les accès et les comptes utilisateurs.</p>
      </div>

      {/* Créer un compte */}
      <div className="card section">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>➕ Créer un accès</div>
        <div className="grid-2" style={{ gap: 10, marginBottom: 10 }}>
          <div>
            <label>Email du membre</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="membre@email.com" />
          </div>
          <div>
            <label>Mot de passe</label>
            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mot de passe sécurisé" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Plan</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["free", "pro", "premium"].map(p => (
              <button key={p} onClick={() => setNewPlan(p)} style={{
                padding: "6px 16px", borderRadius: 20, border: `1px solid ${newPlan === p ? "#3B82F6" : "var(--border)"}`,
                background: newPlan === p ? "#1E2A4A" : "var(--bg2)",
                color: newPlan === p ? "#60A5FA" : "var(--text2)", fontSize: 13, cursor: "pointer", textTransform: "capitalize"
              }}>{p}</button>
            ))}
          </div>
        </div>

        {error && <div style={{ background: "var(--red-bg)", color: "var(--red)", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>❌ {error}</div>}
        {message && <div style={{ background: "var(--green-bg)", color: "var(--green)", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>{message}</div>}

        <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={createUser} disabled={loading}>
          {loading ? "⏳ Création..." : "✅ Créer le compte"}
        </button>
      </div>

      {/* Liste des membres */}
      <div className="card section">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>👥 Membres ({users.length})</div>
          <button className="btn btn-sm" onClick={loadUsers}>🔄 Actualiser</button>
        </div>

        {users.length === 0 ? (
          <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Aucun membre encore</div>
        ) : (
          users.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{u.email}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  {u.videos_used || 0} vidéos utilisées · Créé le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <select value={u.plan} onChange={e => changePlan(u.id, e.target.value)} style={{
                padding: "4px 8px", background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 6, color: "var(--text)", fontSize: 12
              }}>
                <option value="free">Gratuit</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
              {u.email !== ADMIN_EMAIL && (
                <button onClick={() => deleteUser(u.id, u.email)} style={{
                  background: "var(--red-bg)", color: "var(--red)", border: "none",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12
                }}>🗑</button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="card" style={{ background: "var(--blue-bg)", borderColor: "#2A3A5A" }}>
        <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 8 }}>📋 Comment créer un accès :</div>
        <div style={{ fontSize: 13, color: "#B0C4E8", lineHeight: 1.8 }}>
          1. Entre l'email et un mot de passe pour le membre<br/>
          2. Choisis son plan (Gratuit / Pro / Premium)<br/>
          3. Clique "Créer le compte"<br/>
          4. Envoie-lui ses identifiants par message<br/>
          5. Il peut se connecter sur ton site avec ces infos
        </div>
      </div>
    </div>
  );
}
