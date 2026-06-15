import React, { useState, useEffect } from "react";
import { callClaude } from "../utils/api.js";

const PLATFORMS = ["Vinted", "Vestiaire Co", "Chrono24", "eBay", "Shopify", "Leboncoin", "Autre"];
const STATUSES = ["En vente", "Vendu", "Réservé", "Retiré"];
const STATUS_STYLE = {
  "En vente": { bg: "#0F2A1A", color: "#4ADE80" },
  "Vendu": { bg: "#1E2A4A", color: "#60A5FA" },
  "Réservé": { bg: "#2A1F0A", color: "#FCD34D" },
  "Retiré": { bg: "#2A0F0F", color: "#F87171" },
};

function useStock() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("clipforge-stock") || "[]"); } catch { return []; }
  });
  const save = (newItems) => {
    setItems(newItems);
    localStorage.setItem("clipforge-stock", JSON.stringify(newItems));
  };
  return [items, save];
}

export default function Stock() {
  const [items, setItems] = useStock();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    product: "", brand: "", size: "", condition: "Bon état",
    buyPrice: "", sellPrice: "", platform: "Vinted",
    status: "En vente", notes: "", postedAt: new Date().toISOString().split("T")[0],
    soldAt: "", soldPrice: "",
  });

  const resetForm = () => setForm({
    product: "", brand: "", size: "", condition: "Bon état",
    buyPrice: "", sellPrice: "", platform: "Vinted",
    status: "En vente", notes: "", postedAt: new Date().toISOString().split("T")[0],
    soldAt: "", soldPrice: "",
  });

  const addItem = () => {
    if (!form.product) return;
    const item = {
      ...form,
      id: Date.now(),
      buyPrice: parseFloat(form.buyPrice) || 0,
      sellPrice: parseFloat(form.sellPrice) || 0,
      soldPrice: parseFloat(form.soldPrice) || 0,
      createdAt: new Date().toISOString(),
    };
    if (editId) {
      setItems(items.map(i => i.id === editId ? { ...item, id: editId } : i));
      setEditId(null);
    } else {
      setItems([item, ...items]);
    }
    resetForm();
    setShowForm(false);
  };

  const markSold = (id, soldPrice) => {
    setItems(items.map(i => i.id === id ? {
      ...i, status: "Vendu",
      soldPrice: parseFloat(soldPrice) || i.sellPrice,
      soldAt: new Date().toISOString().split("T")[0]
    } : i));
  };

  const deleteItem = (id) => {
    if (confirm("Supprimer cet article ?")) setItems(items.filter(i => i.id !== id));
  };

  const editItem = (item) => {
    setForm({ ...item });
    setEditId(item.id);
    setShowForm(true);
  };

  const generateDesc = async () => {
    if (!form.product) return;
    setGenerating(true);
    try {
      const text = await callClaude({
        system: "Tu génères des descriptions d'annonces courtes. Réponds UNIQUEMENT avec ce JSON: {\"description\": \"description\", \"sellPrice\": 85}",
        messages: [{ role: "user", content: `Produit: ${form.product} ${form.brand}. État: ${form.condition}. Taille: ${form.size}. Prix achat: ${form.buyPrice}€. Plateforme: ${form.platform}. Suggère un prix de vente et une description courte.` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
      });
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setForm(f => ({
        ...f,
        notes: parsed.description || f.notes,
        sellPrice: parsed.sellPrice || f.sellPrice,
      }));
    } catch (e) { alert("Erreur: " + e.message); }
    finally { setGenerating(false); }
  };

  // Stats
  const sold = items.filter(i => i.status === "Vendu");
  const onSale = items.filter(i => i.status === "En vente");
  const totalCA = sold.reduce((a, i) => a + (i.soldPrice || i.sellPrice), 0);
  const totalCost = sold.reduce((a, i) => a + i.buyPrice, 0);
  const totalProfit = totalCA - totalCost;
  const avgMargin = sold.length > 0 ? Math.round((totalProfit / totalCost) * 100) : 0;
  const stockValue = onSale.reduce((a, i) => a + i.buyPrice, 0);
  const potentialRevenue = onSale.reduce((a, i) => a + i.sellPrice, 0);

  // Filter
  const filtered = items.filter(i => {
    const matchFilter = filter === "Tous" || i.status === filter || i.platform === filter;
    const matchSearch = !search || i.product.toLowerCase().includes(search.toLowerCase()) || i.brand?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📦 Gestion du stock</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>Tous tes articles — postés, en vente, vendus.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditId(null); setShowForm(true); }}>
          + Ajouter un article
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { val: items.length, lbl: "Total articles", color: "#F0F0FF" },
          { val: onSale.length, lbl: "En vente", color: "#4ADE80" },
          { val: sold.length, lbl: "Vendus", color: "#60A5FA" },
          { val: `${totalCA.toFixed(0)}€`, lbl: "CA total", color: "#4ADE80" },
          { val: `${totalProfit.toFixed(0)}€`, lbl: "Bénéfice", color: totalProfit >= 0 ? "#4ADE80" : "#F87171" },
          { val: `${stockValue.toFixed(0)}€`, lbl: "Valeur stock", color: "#FCD34D" },
        ].map(s => (
          <div key={s.lbl} className="stat-card" style={{ padding: "10px 8px" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card section">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{editId ? "Modifier l'article" : "Nouvel article"}</div>
            <button style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 18 }} onClick={() => setShowForm(false)}>×</button>
          </div>
          <div className="grid-2" style={{ gap: 10, marginBottom: 10 }}>
            <div><label>Produit *</label><input type="text" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} placeholder="Nike Air Force 1" /></div>
            <div><label>Marque</label><input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Nike" /></div>
            <div><label>Taille / Pointure</label><input type="text" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="42 / M / Unique" /></div>
            <div><label>État</label>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                {["Neuf avec étiquette", "Neuf sans étiquette", "Très bon état", "Bon état", "État correct"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label>Prix d'achat (€)</label><input type="number" value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} placeholder="40" /></div>
            <div><label>Prix de vente (€)</label><input type="number" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} placeholder="80" /></div>
            <div><label>Plateforme</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label>Date de publication</label><input type="date" value={form.postedAt} onChange={e => setForm(f => ({ ...f, postedAt: e.target.value }))} /></div>
            {form.status === "Vendu" && (
              <div><label>Prix vendu (€)</label><input type="number" value={form.soldPrice} onChange={e => setForm(f => ({ ...f, soldPrice: e.target.value }))} placeholder={form.sellPrice} /></div>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Notes / Description</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes sur l'article..." style={{ marginBottom: 6 }} />
            <button className="btn btn-sm" style={{ width: "auto" }} onClick={generateDesc} disabled={generating}>
              {generating ? "⏳" : "✨ Suggérer prix & description avec l'IA"}
            </button>
          </div>
          {form.buyPrice && form.sellPrice && (
            <div style={{ background: "var(--green-bg)", color: "var(--green)", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 10 }}>
              Marge estimée : +{(parseFloat(form.sellPrice) - parseFloat(form.buyPrice)).toFixed(0)}€
              ({Math.round(((parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) / parseFloat(form.buyPrice)) * 100)}%)
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addItem}>{editId ? "Modifier" : "Ajouter au stock"}</button>
            <button className="btn" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ width: 160, padding: "6px 10px", fontSize: 12 }} />
        {["Tous", ...STATUSES, ...PLATFORMS].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "4px 10px", borderRadius: 16, border: `1px solid ${filter === f ? "#3B82F6" : "var(--border)"}`,
            background: filter === f ? "#1E2A4A" : "var(--bg2)", color: filter === f ? "#60A5FA" : "var(--text2)",
            fontSize: 11, cursor: "pointer"
          }}>{f}</button>
        ))}
      </div>

      {/* Liste des articles */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun article</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Ajoute ton premier article ou poste une annonce via l'extension Chrome.</div>
          <button className="btn btn-primary" style={{ width: "auto", padding: "8px 20px" }} onClick={() => setShowForm(true)}>+ Ajouter</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(item => {
            const profit = (item.soldPrice || item.sellPrice) - item.buyPrice;
            const margin = item.buyPrice > 0 ? Math.round((profit / item.buyPrice) * 100) : 0;
            return (
              <div key={item.id} className="card card-sm" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.product}</span>
                    {item.brand && <span style={{ fontSize: 11, color: "var(--text3)" }}>{item.brand}</span>}
                    {item.size && <span style={{ fontSize: 11, background: "var(--bg3)", padding: "1px 6px", borderRadius: 6 }}>{item.size}</span>}
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: STATUS_STYLE[item.status]?.bg, color: STATUS_STYLE[item.status]?.color }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {item.platform} · {item.condition} · Posté le {item.postedAt}
                    {item.soldAt && ` · Vendu le ${item.soldAt}`}
                  </div>
                  {item.notes && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{item.notes.slice(0, 60)}{item.notes.length > 60 ? "..." : ""}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: profit >= 0 ? "#4ADE80" : "#F87171" }}>
                    +{profit.toFixed(0)}€
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>
                    {item.buyPrice}€ → {item.status === "Vendu" ? item.soldPrice || item.sellPrice : item.sellPrice}€
                  </div>
                  <div style={{ fontSize: 10, color: margin >= 30 ? "#4ADE80" : "var(--text3)" }}>{margin}% marge</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  {item.status === "En vente" && (
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: "4px 8px", background: "#1E2A4A", color: "#60A5FA", border: "1px solid #2A3A5A" }}
                      onClick={() => {
                        const p = prompt("Prix de vente final (€) :", item.sellPrice);
                        if (p !== null) markSold(item.id, p);
                      }}>
                      ✓ Vendu
                    </button>
                  )}
                  <button className="btn btn-sm" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => editItem(item)}>✏️</button>
                  <button className="btn btn-sm" style={{ fontSize: 11, padding: "4px 8px", background: "var(--red-bg)", color: "var(--red)", border: "none" }} onClick={() => deleteItem(item.id)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Résumé en bas */}
      {items.length > 0 && (
        <div className="card" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>{totalCA.toFixed(0)}€</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>CA réalisé</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: totalProfit >= 0 ? "#4ADE80" : "#F87171" }}>{totalProfit.toFixed(0)}€</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Bénéfice net</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#60A5FA" }}>{potentialRevenue.toFixed(0)}€</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>CA potentiel</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FCD34D" }}>{avgMargin}%</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Marge moy.</div>
          </div>
        </div>
      )}
    </div>
  );
}
