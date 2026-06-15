import React, { useState } from "react";

const PLATFORMS = ["Vinted", "Vestiaire Co", "eBay", "Chrono24", "Stripe", "PayPal", "Crypto", "Autre"];

export default function RevenueDashboard() {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ platform: "Vinted", product: "", buy_price: "", sell_price: "", date: new Date().toISOString().split("T")[0], fees: "" });
  const [monthlyGoal, setMonthlyGoal] = useState(2000);
  const [showForm, setShowForm] = useState(false);

  const addSale = () => {
    if (!form.product || !form.sell_price) return;
    const fees = parseFloat(form.fees) || 0;
    const buy = parseFloat(form.buy_price) || 0;
    const sell = parseFloat(form.sell_price);
    const profit = sell - buy - fees;
    const margin = buy > 0 ? Math.round((profit / buy) * 100) : 0;
    setSales(prev => [...prev, { ...form, buy_price: buy, sell_price: sell, fees, profit, margin, id: Date.now() }]);
    setForm({ platform: "Vinted", product: "", buy_price: "", sell_price: "", date: new Date().toISOString().split("T")[0], fees: "" });
    setShowForm(false);
  };

  const removeSale = (id) => setSales(prev => prev.filter(s => s.id !== id));

  const totalRevenue = sales.reduce((a, s) => a + s.sell_price, 0);
  const totalCost = sales.reduce((a, s) => a + s.buy_price, 0);
  const totalFees = sales.reduce((a, s) => a + s.fees, 0);
  const totalProfit = sales.reduce((a, s) => a + s.profit, 0);
  const avgMargin = sales.length > 0 ? Math.round(sales.reduce((a, s) => a + s.margin, 0) / sales.length) : 0;
  const goalPercent = Math.min(100, Math.round((totalProfit / monthlyGoal) * 100));

  const byPlatform = PLATFORMS.map(p => ({
    name: p,
    count: sales.filter(s => s.platform === p).length,
    revenue: sales.filter(s => s.platform === p).reduce((a, s) => a + s.sell_price, 0),
    profit: sales.filter(s => s.platform === p).reduce((a, s) => a + s.profit, 0),
  })).filter(p => p.count > 0);

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>💰 Dashboard Revenus</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>Suivi de tes ventes, marges et objectifs mensuels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Ajouter une vente</button>
      </div>

      {/* Objectif mensuel */}
      <div className="card section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>🎯 Objectif mensuel</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={monthlyGoal} onChange={e => setMonthlyGoal(parseInt(e.target.value) || 0)} style={{ width: 90, padding: "4px 8px", fontSize: 13 }} />
            <span style={{ fontSize: 13 }}>€</span>
          </div>
        </div>
        <div className="progress-track" style={{ height: 10, marginBottom: 6 }}>
          <div className="progress-fill" style={{ width: `${goalPercent}%`, background: goalPercent >= 100 ? "#34C759" : goalPercent >= 50 ? "#FFCC00" : "#1A1A1A" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--text2)" }}>{totalProfit.toFixed(0)}€ bénéfice / {monthlyGoal}€ objectif</span>
          <span style={{ fontWeight: 700, color: goalPercent >= 100 ? "#27500A" : "var(--text)" }}>{goalPercent}%</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "CA total", val: `${totalRevenue.toFixed(0)}€`, color: "#185FA5" },
          { label: "Coût total", val: `${(totalCost + totalFees).toFixed(0)}€`, color: "#712B13" },
          { label: "Bénéfice net", val: `${totalProfit.toFixed(0)}€`, color: "#27500A" },
          { label: "Marge moy.", val: `${avgMargin}%`, color: avgMargin >= 30 ? "#27500A" : "#633806" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-val" style={{ color: s.color, fontSize: 20 }}>{s.val}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="card section">
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Nouvelle vente</div>
          <div className="grid-2" style={{ gap: 10, marginBottom: 10 }}>
            <div>
              <label>Produit</label>
              <input type="text" value={form.product} onChange={e => setForm(p => ({...p, product: e.target.value}))} placeholder="Ex: Nike Air Force 1 T42" />
            </div>
            <div>
              <label>Plateforme</label>
              <select value={form.platform} onChange={e => setForm(p => ({...p, platform: e.target.value}))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>Prix d'achat (€)</label>
              <input type="number" value={form.buy_price} onChange={e => setForm(p => ({...p, buy_price: e.target.value}))} placeholder="40" />
            </div>
            <div>
              <label>Prix de vente (€)</label>
              <input type="number" value={form.sell_price} onChange={e => setForm(p => ({...p, sell_price: e.target.value}))} placeholder="80" />
            </div>
            <div>
              <label>Frais plateforme (€)</label>
              <input type="number" value={form.fees} onChange={e => setForm(p => ({...p, fees: e.target.value}))} placeholder="4" />
            </div>
            <div>
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} />
            </div>
          </div>
          {form.buy_price && form.sell_price && (
            <div style={{ background: "var(--green-bg)", color: "var(--green)", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>
              Bénéfice estimé : {(parseFloat(form.sell_price) - parseFloat(form.buy_price) - (parseFloat(form.fees) || 0)).toFixed(0)}€
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addSale}>Ajouter</button>
            <button className="btn" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Par plateforme */}
      {byPlatform.length > 0 && (
        <div className="card section">
          <div className="section-title">Par plateforme</div>
          {byPlatform.map(p => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name} <span style={{ fontWeight: 400, color: "var(--text3)", fontSize: 12 }}>({p.count} ventes)</span></div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>+{p.profit.toFixed(0)}€ bénéfice</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>CA {p.revenue.toFixed(0)}€</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des ventes */}
      {sales.length > 0 && (
        <div className="card section">
          <div className="section-title">Toutes les ventes ({sales.length})</div>
          {sales.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{s.product}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.platform} · {s.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: s.profit >= 0 ? "#27500A" : "#712B13", fontWeight: 600 }}>+{s.profit.toFixed(0)}€</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Vendu {s.sell_price}€ · {s.margin}% marge</div>
              </div>
              <button onClick={() => removeSale(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {sales.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text3)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucune vente enregistrée</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Clique sur "+ Ajouter une vente" pour commencer à tracker tes revenus</div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Première vente</button>
        </div>
      )}
    </div>
  );
}
