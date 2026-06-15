import React, { useState, useRef } from "react";

const HF_KEY_STORAGE = "clipforge-hf-key";

export default function Model3DGenerator() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(HF_KEY_STORAGE) || "");
  const [keySaved, setKeySaved] = useState(false);
  const [image, setImage] = useState(null);
  const [objectName, setObjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("clipforge-3d-history") || "[]"); } catch { return []; }
  });
  const fileRef = useRef();

  const saveKey = () => {
    localStorage.setItem(HF_KEY_STORAGE, apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage({ file, url: URL.createObjectURL(file) });
    setResult(null);
    setError("");
  };

  const generate = async () => {
    if (!apiKey) { setError("Configure ta clé Hugging Face d'abord !"); return; }
    if (!image) { setError("Ajoute une photo !"); return; }
    setLoading(true); setError(""); setResult(null);

    try {
      // Appel au Space TripoSR via l'API Gradio de Hugging Face
      const formData = new FormData();
      formData.append("files", image.file);

      // Utilise le Space public TripoSR
      const res = await fetch(
        "https://stabilityai-triposr.hf.space/run/predict",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            data: [
              { path: await toBase64(image.file) },
              0.85, // foreground ratio
              true,  // do_remove_background
            ]
          }),
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!res.ok) throw new Error(`Erreur ${res.status} — vérifie ta clé HF`);
      const data = await res.json();

      // Le résultat contient l'URL du fichier .obj
      const modelUrl = data.data?.[0]?.url || data.data?.[1]?.url;
      if (!modelUrl) throw new Error("Pas de modèle généré");

      const entry = {
        id: Date.now(),
        name: objectName || "Modèle 3D",
        thumbnail: image.url,
        modelUrl,
        createdAt: new Date().toLocaleDateString("fr-FR"),
      };
      setResult(entry);
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("clipforge-3d-history", JSON.stringify(newHistory));
    } catch (err) {
      setError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const openTripoSR = () => {
    window.open("https://huggingface.co/spaces/stabilityai/TripoSR", "_blank");
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🧊 Générateur de modèles 3D</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>
          Envoie une photo → l'IA crée un modèle 3D compatible Blender (.obj/.glb).
        </p>
      </div>

      {/* Clé HF */}
      <div className="card section" style={{ borderColor: apiKey ? "var(--border)" : "#EF9F27", background: apiKey ? "var(--bg2)" : "var(--amber-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span>{apiKey ? "✅" : "⚠️"}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{apiKey ? "Clé Hugging Face configurée" : "Entre ta clé Hugging Face"}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>{apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "huggingface.co → Settings → Access Tokens"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="hf_..." style={{ flex: 1 }} />
          <button className="btn btn-sm btn-primary" onClick={saveKey}>{keySaved ? "✓ Sauvé !" : "Sauvegarder"}</button>
        </div>
      </div>

      {/* Upload photo */}
      <div className="card section">
        <div style={{ marginBottom: 10 }}>
          <label>Nom du produit (optionnel)</label>
          <input type="text" value={objectName} onChange={e => setObjectName(e.target.value)} placeholder="Ex: Nike Air Force 1, Rolex Submariner..." />
        </div>

        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>📸 Photo du produit</div>

        <div onClick={() => fileRef.current?.click()} style={{
          border: "2px dashed var(--border)", borderRadius: 12, padding: "20px",
          textAlign: "center", cursor: "pointer", marginBottom: 12, color: "var(--text3)",
          transition: "border-color .15s"
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#3B82F6"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          {image ? (
            <img src={image.url} alt="" style={{ maxHeight: 200, borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
              <div style={{ fontWeight: 500 }}>Clique pour ajouter une photo</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Fond blanc recommandé · JPG ou PNG</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />

        {image && (
          <button className="btn btn-sm" style={{ marginBottom: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--text2)" }}
            onClick={() => { setImage(null); fileRef.current.value = ""; }}>
            🗑 Changer la photo
          </button>
        )}

        <div className="card" style={{ background: "var(--bg3)", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8 }}>
            💡 <strong>Conseils :</strong><br/>
            • Fond blanc ou uni = meilleur résultat<br/>
            • Objet centré et bien éclairé<br/>
            • Photo nette, min 512×512px
          </div>
        </div>

        {error && <div style={{ background: "var(--red-bg)", color: "var(--red)", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 10 }}>❌ {error}</div>}

        <button className="btn btn-primary" style={{ justifyContent: "center", padding: 12, marginBottom: 8 }} onClick={generate} disabled={loading || !image}>
          {loading ? "⏳ Génération en cours (1-2 min)..." : "🧊 Générer le modèle 3D"}
        </button>

        {/* Alternative manuelle */}
        <button className="btn" style={{ justifyContent: "center" }} onClick={openTripoSR}>
          🌐 Ouvrir TripoSR directement (alternative gratuite)
        </button>
      </div>

      {loading && (
        <div className="card section" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Génération du modèle 3D...</div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>L'IA analyse ta photo et construit le modèle 3D. Ça prend 1-3 minutes.</div>
          <div className="progress-track" style={{ height: 4, marginTop: 12 }}>
            <div className="progress-fill" style={{ width: "60%", animation: "pulse 2s infinite" }} />
          </div>
        </div>
      )}

      {result && (
        <div className="card section">
          <div style={{ fontWeight: 700, fontSize: 15, color: "#4ADE80", marginBottom: 12 }}>🎉 Modèle 3D généré !</div>
          {result.thumbnail && <img src={result.thumbnail} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 200, objectFit: "contain" }} />}
          <a href={result.modelUrl} download={`${objectName || "model"}.obj`} target="_blank" rel="noreferrer"
            className="btn btn-primary" style={{ justifyContent: "center", textDecoration: "none", marginBottom: 8 }}>
            ⬇️ Télécharger le modèle (.obj)
          </a>
          <div className="card" style={{ background: "var(--blue-bg)", borderColor: "#2A3A5A" }}>
            <div style={{ fontWeight: 600, color: "#60A5FA", marginBottom: 6 }}>📋 Importer dans Blender :</div>
            <div style={{ fontSize: 12, color: "#B0C4E8", lineHeight: 1.8 }}>
              1. Ouvre Blender<br/>
              2. File → Import → Wavefront (.obj)<br/>
              3. Sélectionne ton fichier .obj<br/>
              4. Le modèle 3D apparaît dans Blender !
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div className="card section">
          <div className="section-title">Modèles générés</div>
          {history.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none" }}>
              {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{item.createdAt}</div>
              </div>
              {item.modelUrl && (
                <a href={item.modelUrl} download target="_blank" rel="noreferrer" className="btn btn-sm" style={{ textDecoration: "none" }}>⬇️ OBJ</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
