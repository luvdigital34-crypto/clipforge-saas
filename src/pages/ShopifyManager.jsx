import React, { useState } from "react";
import { callClaude } from "../utils/api.js";

export default function ShopifyManager() {
  const [shopUrl, setShopUrl] = useState(localStorage.getItem("shopify_url") || "");
  const [accessToken, setAccessToken] = useState(localStorage.getItem("shopify_token") || "");
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: "", description: "", price: "", vendor: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const connect = async () => {
    if (!shopUrl || !accessToken) return;
    setLoading(true);
    try {
      const shop = shopUrl.replace("https://", "").replace("/", "");
      const res = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Connexion échouée — vérifie ton URL et token");
      localStorage.setItem("shopify_url", shopUrl);
      localStorage.setItem("shopify_token", accessToken);
      setConnected(true);
      await loadProducts(shop, accessToken);
      await loadOrders(shop, accessToken);
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setLoading(false); }
  };

  const loadProducts = async (shop, token) => {
    const res = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=20`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const data = await res.json();
    setProducts(data.products || []);
  };

  const loadOrders = async (shop, token) => {
    const res = await fetch(`https://${shop}/admin/api/2024-01/orders.json?limit=10&status=any`, {
      headers: { "X-Shopify-Access-Token": token }
    });
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const generateWithAI = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const text = await callClaude({
        system: `Tu génères des fiches produits Shopify optimisées. Réponds UNIQUEMENT avec ce JSON :
{"title": "titre SEO", "description": "description HTML simple avec sauts de ligne", "price": "29.99", "vendor": "marque", "tags": "tag1,tag2,tag3"}`,
        messages: [{ role: "user", content: `Génère une fiche produit Shopify pour : ${aiPrompt}` }],
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
      });
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setNewProduct({ title: parsed.title, description: parsed.description, price: parsed.price, vendor: parsed.vendor });
    } catch (err) { alert("Erreur IA : " + err.message); }
    finally { setGenerating(false); }
  };

  const createProduct = async () => {
    if (!newProduct.title || !connected) return;
    setLoading(true);
    const shop = shopUrl.replace("https://", "").replace("/", "");
    try {
      const res = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: newProduct.title, body_html: newProduct.description, vendor: newProduct.vendor, variants: [{ price: newProduct.price }] } })
      });
      if (!res.ok) throw new Error("Erreur création produit");
      alert("✅ Produit créé sur Shopify !");
      setNewProduct({ title: "", description: "", price: "", vendor: "" });
      await loadProducts(shop, accessToken);
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setLoading(false); }
  };

  const totalRevenue = orders.reduce((a, o) => a + parseFloat(o.total_price || 0), 0);

  if (!connected) {
    return (
      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🛒 Shopify Manager</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>Connecte ton store Shopify pour gérer tes produits et commandes depuis ClipForge.</p>
        </div>
        <div className="card section" style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: 14 }}>
            <label>URL de ton store Shopify</label>
            <input type="text" value={shopUrl} onChange={e => setShopUrl(e.target.value)} placeholder="mon-store.myshopify.com" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label>Access Token (Admin API)</label>
            <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="shpat_..." />
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              Shopify Admin → Paramètres → Apps → Développer des apps → Créer une app → API credentials
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={connect} disabled={loading}>
            {loading ? "⏳ Connexion..." : "🔗 Connecter Shopify"}
          </button>
        </div>
        <div className="card" style={{ marginTop: 16, fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>
          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>📋 Comment obtenir ton Access Token :</div>
          <div>1. Va sur <strong>admin.shopify.com</strong></div>
          <div>2. Paramètres → Apps et canaux de vente</div>
          <div>3. Développer des apps → Créer une app</div>
          <div>4. Configurer les portées API (products, orders, customers)</div>
          <div>5. Installer l'app → Copier le token Admin API</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>🛒 Shopify Manager</h1>
          <div style={{ fontSize: 12, color: "#4ADE80" }}>✓ Connecté · {shopUrl}</div>
        </div>
        <button className="btn btn-sm" onClick={() => setConnected(false)}>Déconnecter</button>
      </div>

      {/* Stats */}
      <div className="grid-3 section">
        <div className="stat-card"><div className="stat-val" style={{ color: "#60A5FA" }}>{products.length}</div><div className="stat-lbl">Produits</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: "#4ADE80" }}>{orders.length}</div><div className="stat-lbl">Commandes récentes</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: "#FCD34D" }}>{totalRevenue.toFixed(0)}€</div><div className="stat-lbl">CA récent</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["dashboard", "📊 Vue globale"], ["products", "📦 Produits"], ["orders", "🧾 Commandes"], ["create", "✨ Créer produit IA"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${tab === k ? "#3B82F6" : "var(--border)"}`, background: tab === k ? "#1E2A4A" : "#111118", color: tab === k ? "#60A5FA" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="card">
          <div className="section-title">Commandes récentes</div>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div><div style={{ fontWeight: 500 }}>#{o.order_number} · {o.contact_email || "Client"}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontWeight: 600, color: "#4ADE80" }}>{o.total_price}€</div><span style={{ fontSize: 10, background: o.financial_status === "paid" ? "#0F2A1A" : "#2A1F0A", color: o.financial_status === "paid" ? "#4ADE80" : "#FCD34D", padding: "1px 6px", borderRadius: 8 }}>{o.financial_status}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="card">
          <div className="section-title">Produits ({products.length})</div>
          {products.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div><div style={{ fontWeight: 500 }}>{p.title}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>{p.vendor}</div></div>
              <div style={{ fontWeight: 600, color: "#60A5FA" }}>{p.variants?.[0]?.price}€</div>
            </div>
          ))}
        </div>
      )}

      {tab === "orders" && (
        <div className="card">
          <div className="section-title">Commandes</div>
          {orders.map(o => (
            <div key={o.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>#{o.order_number}</span>
                <span style={{ color: "#4ADE80", fontWeight: 600 }}>{o.total_price}€</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{o.contact_email} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div>
          <div className="card section">
            <div style={{ fontWeight: 600, marginBottom: 10 }}>✨ Générer avec l'IA</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ex: Veste imperméable pour homme sport outdoor..." style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={generateWithAI} disabled={generating}>{generating ? "⏳" : "Générer"}</button>
            </div>
          </div>
          <div className="card section">
            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div><label>Titre</label><input type="text" value={newProduct.title} onChange={e => setNewProduct(p => ({...p, title: e.target.value}))} /></div>
              <div><label>Prix (€)</label><input type="text" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} /></div>
              <div><label>Marque</label><input type="text" value={newProduct.vendor} onChange={e => setNewProduct(p => ({...p, vendor: e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label>Description</label><textarea rows={4} value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} /></div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={createProduct} disabled={loading || !newProduct.title}>
              {loading ? "⏳ Création..." : "🚀 Publier sur Shopify"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
