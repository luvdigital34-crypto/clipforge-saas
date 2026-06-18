import React, { useState, useEffect, useRef } from "react";
import { callClaude } from "../utils/api.js";

// ── Générateur de scripts Blender ─────────────────────────────────────────────
const BLENDER_SYSTEM = `Tu es un expert Blender Python. Tu génères des scripts Blender Python complets et fonctionnels.
Réponds UNIQUEMENT avec le code Python, sans markdown, sans backticks, sans explications.
Le script doit s'exécuter directement dans Blender Scripting panel SANS aucune modification.

RÈGLES ABSOLUES DE COMPATIBILITÉ :
- Toujours commencer par : import bpy, mathutils, math
- Toujours nettoyer la scène : bpy.ops.object.select_all(action='SELECT') puis bpy.ops.object.delete()
- Pour le world/background : utiliser bpy.context.scene.world.color = (0.01, 0.01, 0.01) au lieu de nodes
- Ne JAMAIS utiliser world.node_tree.nodes["Background"] car ça plante
- Utiliser UNIQUEMENT des formes primitives (cube, sphere, cylinder, torus) pour les objets
- Pour les matériaux : créer mat = bpy.data.materials.new(name="Mat") puis mat.diffuse_color = (R, G, B, 1.0) sans nodes
- Pour les keyframes : utiliser obj.keyframe_insert(data_path="rotation_euler", frame=X)
- Pour la caméra : bpy.ops.object.camera_add() puis bpy.context.scene.camera = bpy.context.active_object
- Pour les lumières : bpy.ops.object.light_add(type='POINT') puis bpy.context.active_object.data.energy = 1000
- Ne JAMAIS configurer l'export vidéo/ffmpeg (scene.render.image_settings.file_format, ffmpeg, codec) car ça plante — laisser les paramètres de rendu par défaut
- Le script DOIT être complet et fonctionner du premier coup sans erreur
- Rester concis pour ne pas dépasser la limite de tokens`;

const SCENE_PRESETS = [
  { id: "product_rotation", label: "Rotation produit", emoji: "🔄", desc: "Objet qui tourne sur lui-même — parfait TikTok" },
  { id: "sneaker_showcase", label: "Showcase sneaker", emoji: "👟", desc: "Sneaker flottante avec éclairage studio" },
  { id: "watch_luxury", label: "Montre luxe", emoji: "⌚", desc: "Montre sur fond sombre avec reflets" },
  { id: "logo_3d", label: "Logo 3D animé", emoji: "🔤", desc: "Texte 3D avec animation d'entrée" },
  { id: "particles", label: "Particules TikTok", emoji: "✨", desc: "Explosion de particules colorées" },
  { id: "product_explode", label: "Vue éclatée", emoji: "💥", desc: "Produit qui se démonte/remonte" },
  { id: "hologram", label: "Hologramme", emoji: "🔵", desc: "Effet hologramme futuriste" },
  { id: "custom", label: "Scène personnalisée", emoji: "🎨", desc: "Décris ta scène librement" },
];

const THREE_SCENES = [
  { id: "rotating_box", label: "Cube tournant", emoji: "📦" },
  { id: "sneaker_float", label: "Objet flottant", emoji: "👟" },
  { id: "particles_burst", label: "Explosion particules", emoji: "✨" },
  { id: "text_3d", label: "Texte 3D", emoji: "🔤" },
  { id: "tiktok_bg", label: "Background TikTok", emoji: "📱" },
];

export default function Studio3D() {
  const [activeTab, setActiveTab] = useState("blender");
  const [preset, setPreset] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [objectName, setObjectName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [duration, setDuration] = useState("10");
  const [generatedScript, setGeneratedScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Three.js
  const canvasRef = useRef(null);
  const [threeScene, setThreeScene] = useState("rotating_box");
  const [threeText, setThreeText] = useState("ClipForge");
  const [threeColor, setThreeColor] = useState("#3B82F6");
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef(null);
  const rendererRef = useRef(null);

  const generateBlenderScript = async () => {
    if (!preset) { alert("Choisis une scène !"); return; }
    setLoading(true); setGeneratedScript("");

    const presetInfo = SCENE_PRESETS.find(s => s.id === preset);
    const prompt = preset === "custom"
      ? customPrompt
      : `Génère un script Blender Python complet pour : ${presetInfo?.desc}. 
Objet/Texte : "${objectName || 'produit'}"
Couleur principale : ${color}
Durée animation : ${duration} secondes
Format : 1080x1920 (TikTok vertical)
Inclus : éclairage studio, matériaux PBR, animation fluide, rendu Eevee optimisé, export MP4.`;

    try {
      const rawScript = await callClaude({
        system: BLENDER_SYSTEM,
        messages: [{ role: "user", content: prompt }],
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
      });
      const script = rawScript.replace(/```python/gi, "").replace(/```/g, "").trim();
      setGeneratedScript(script);
    } catch (err) { alert("Erreur : " + err.message); }
    finally { setLoading(false); }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipforge-${preset}-${Date.now()}.py`;
    a.click();
  };

  // ── Three.js Scene ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "threejs") return;
    loadThreeJS();
  }, [activeTab]);

  const loadThreeJS = () => {
    if (window.THREE) { initThreeScene(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = initThreeScene;
    document.head.appendChild(script);
  };

  const initThreeScene = () => {
    if (!canvasRef.current || !window.THREE) return;
    const THREE = window.THREE;

    // Cleanup previous renderer
    if (rendererRef.current) { rendererRef.current.dispose(); }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const canvas = canvasRef.current;
    const w = canvas.clientWidth, h = canvas.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x0A0A0F, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
    camera.position.z = 3;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(parseInt(threeColor.replace('#','0x')), 2, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(0x3B82F6, 1, 10);
    pointLight2.position.set(-2, -1, 1);
    scene.add(pointLight2);

    let mesh;
    const colorHex = parseInt(threeColor.replace('#',''), 16);

    if (threeScene === "rotating_box") {
      const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 100 });
      mesh = new THREE.Mesh(geo, mat);
    } else if (threeScene === "sneaker_float") {
      const geo = new THREE.TorusGeometry(0.8, 0.3, 16, 100);
      const mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 150 });
      mesh = new THREE.Mesh(geo, mat);
    } else if (threeScene === "particles_burst") {
      const geo = new THREE.BufferGeometry();
      const count = 1000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 8;
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: colorHex, size: 0.05 });
      mesh = new THREE.Points(geo, mat);
    } else if (threeScene === "hologram" || threeScene === "tiktok_bg") {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const mat = new THREE.MeshPhongMaterial({ color: colorHex, wireframe: true, shininess: 200 });
      mesh = new THREE.Mesh(geo, mat);
    } else {
      const geo = new THREE.SphereGeometry(1, 32, 32);
      const mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 100 });
      mesh = new THREE.Mesh(geo, mat);
    }

    scene.add(mesh);

    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x2A2A3A, 0x1A1A24);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    let t = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      t += 0.01;
      if (mesh) {
        mesh.rotation.y += 0.01;
        mesh.rotation.x += 0.005;
        if (threeScene === "sneaker_float") mesh.position.y = Math.sin(t) * 0.2;
        if (threeScene === "particles_burst") mesh.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();
    setIsPlaying(true);
  };

  const stopScene = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🎬 Studio 3D</h1>
        <p style={{ color: "var(--text2)", fontSize: 13 }}>Crée des animations 3D pour TikTok — directement dans le navigateur ou via Blender.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["blender", "🎨 Scripts Blender"], ["threejs", "✨ Animation 3D Live"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: "9px", borderRadius: 10,
            border: `1px solid ${activeTab === id ? "#3B82F6" : "var(--border)"}`,
            background: activeTab === id ? "var(--blue-bg)" : "var(--bg2)",
            color: activeTab === id ? "#60A5FA" : "var(--text2)",
            fontWeight: activeTab === id ? 600 : 400, fontSize: 13, cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>

      {/* ── BLENDER ── */}
      {activeTab === "blender" && (
        <>
          <div className="section">
            <div className="section-title">Type de scène</div>
            <div className="grid-3" style={{ gap: 8 }}>
              {SCENE_PRESETS.map(s => (
                <div key={s.id} onClick={() => setPreset(s.id)} style={{
                  border: `1px solid ${preset === s.id ? "#3B82F6" : "var(--border)"}`,
                  background: preset === s.id ? "var(--blue-bg)" : "var(--bg2)",
                  borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                  textAlign: "center", transition: "all .15s"
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: preset === s.id ? "#60A5FA" : "var(--text)" }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card section">
            {preset === "custom" ? (
              <div>
                <label>Décris ta scène Blender</label>
                <textarea rows={4} value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Une montre Rolex Submariner qui tourne lentement sur un socle noir avec des reflets dorés, éclairage studio professionnel, rendu photoréaliste..." />
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <label>Nom de l'objet / texte</label>
                  <input type="text" value={objectName} onChange={e => setObjectName(e.target.value)} placeholder="Nike AF1, Rolex, ClipForge..." />
                </div>
                <div>
                  <label>Durée (secondes)</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)}>
                    <option value="5">5 sec</option>
                    <option value="10">10 sec</option>
                    <option value="15">15 sec</option>
                    <option value="30">30 sec</option>
                    <option value="60">60 sec</option>
                  </select>
                </div>
                <div>
                  <label>Couleur principale</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: 38, padding: "2px 6px" }} />
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ marginTop: 12, justifyContent: "center" }} onClick={generateBlenderScript} disabled={loading || !preset}>
              {loading ? "⏳ Génération du script..." : "🎨 Générer le script Blender"}
            </button>
          </div>

          {generatedScript && (
            <div className="card section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>✅ Script Blender généré</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-sm" onClick={copyScript}>{copied ? "✓ Copié !" : "📋 Copier"}</button>
                  <button className="btn btn-sm btn-primary" onClick={downloadScript}>⬇️ .py</button>
                </div>
              </div>

              <div style={{ background: "#0A0A0F", borderRadius: 8, padding: "12px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6, maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", color: "#60A5FA" }}>
                {generatedScript}
              </div>

              <div className="card" style={{ marginTop: 12, background: "var(--amber-bg)", borderColor: "#5A3A0A" }}>
                <div style={{ fontWeight: 600, color: "var(--amber)", marginBottom: 6 }}>📋 Comment utiliser ce script dans Blender :</div>
                <div style={{ fontSize: 12, color: "#E8D5A0", lineHeight: 1.8 }}>
                  1. Ouvre Blender → onglet <strong>Scripting</strong> en haut<br/>
                  2. Clique <strong>New</strong> pour créer un nouveau script<br/>
                  3. <strong>Colle le script</strong> (Ctrl+V)<br/>
                  4. Clique <strong>▶ Run Script</strong> (ou Alt+P)<br/>
                  5. La scène se crée automatiquement !<br/>
                  6. Pour exporter : Render → Render Animation → MP4
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── THREE.JS LIVE ── */}
      {activeTab === "threejs" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {THREE_SCENES.map(s => (
              <button key={s.id} onClick={() => { setThreeScene(s.id); setTimeout(initThreeScene, 100); }} style={{
                padding: "6px 12px", borderRadius: 20,
                border: `1px solid ${threeScene === s.id ? "#3B82F6" : "var(--border)"}`,
                background: threeScene === s.id ? "var(--blue-bg)" : "var(--bg2)",
                color: threeScene === s.id ? "#60A5FA" : "var(--text2)", fontSize: 12, cursor: "pointer"
              }}>{s.emoji} {s.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, marginBottom: 4 }}>Couleur</label>
              <input type="color" value={threeColor} onChange={e => setThreeColor(e.target.value)} style={{ width: "100%", height: 36, padding: "2px 6px" }} />
            </div>
            <button className="btn btn-primary" style={{ flex: 1, marginTop: 18 }} onClick={() => { if(isPlaying) { stopScene(); } else { initThreeScene(); } }}>
              {isPlaying ? "⏹ Stop" : "▶ Lancer"}
            </button>
            <button className="btn" style={{ flex: 1, marginTop: 18 }} onClick={initThreeScene}>🔄 Refresh</button>
          </div>

          {/* Canvas */}
          <div style={{ background: "#0A0A0F", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 14 }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: 320, display: "block" }} width={800} height={320} />
          </div>

          <div className="card" style={{ background: "var(--blue-bg)", borderColor: "#2A3A5A", fontSize: 13, color: "#B0C4E8" }}>
            💡 Pour exporter en vidéo : utilise un enregistreur d'écran (OBS, Xbox Game Bar Win+G) pendant que l'animation tourne. Pour une qualité optimale, utilise le script Blender.
          </div>
        </>
      )}
    </div>
  );
}
