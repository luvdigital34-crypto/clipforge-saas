const SYSTEM = `Tu es un expert en montage vidéo TikTok viral. Tu analyses précisément le script fourni et tu crées un plan de montage détaillé et cohérent avec le contenu. Chaque segment doit correspondre exactement à une partie du script. Réponds UNIQUEMENT avec du JSON pur, zéro backtick, zéro markdown.`;

async function callClaude(apiKey, prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur ${res.status}`);
  }
  const data = await res.json();
  let text = data.content?.[0]?.text || "{}";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  try { return JSON.parse(text); } catch { return null; }
}

async function hookAgent(apiKey, script) {
  const r = await callClaude(apiKey, `Analyse ce script TikTok et crée un hook ultra-percutant basé sur son contenu exact:

SCRIPT: "${script}"

Crée un hook qui capture l'essence du message principal du script. Doit donner envie de continuer à regarder.

JSON: {"hookText":"hook percutant lié au script (max 8 mots)","hookDuration":2500,"hookStyle":"text","soundSuggestion":"type de son adapté au contenu","hookEmotion":"émotion principale visée"}`);
  return r?.hookText ? r : { hookText: "Tu dois voir ça 👀", hookDuration: 2500, hookStyle: "text", soundSuggestion: "son dynamique", hookEmotion: "curiosité" };
}

async function scriptAgent(apiKey, script, imageCount) {
  const r = await callClaude(apiKey, `Analyse ce script TikTok et découpe-le en segments précis pour le montage vidéo:

SCRIPT COMPLET: "${script}"
NOMBRE D'IMAGES DISPONIBLES: ${imageCount}

Instructions:
- Découpe le script en ${Math.min(imageCount > 0 ? imageCount : 5, 10)} segments naturels
- Chaque segment = une phrase ou idée clé du script
- Assigne une image différente à chaque segment (index 0 à ${imageCount - 1})
- Le sous-titre doit être le texte exact du segment (max 8 mots)
- Les durées doivent être cohérentes avec la longueur du texte

JSON tableau: [{"index":0,"text":"texte exact du script pour ce segment","imageIndex":0,"startMs":0,"durationMs":3000,"transition":"cut","subtitleText":"résumé court du segment","emphasis":true}]`);
  if (Array.isArray(r) && r.length > 0) return r;
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  return sentences.slice(0, 10).map((s, i) => ({
    index: i, text: s.trim(), imageIndex: i % Math.max(imageCount, 1),
    startMs: i * 3000, durationMs: 3000, transition: i === 0 ? "fade" : "cut",
    subtitleText: s.trim().slice(0, 50), emphasis: i === 0
  }));
}

async function variantAgent(apiKey, script) {
  const r = await callClaude(apiKey, `Analyse ce script et crée 3 variantes de montage adaptées à son contenu:

SCRIPT: "${script}"

Chaque variante doit avoir un style différent mais rester cohérente avec le message du script.

JSON tableau de 3 objets: [{"id":"variant_a","name":"nom descriptif","pace":"fast","colorFilter":"neutral","musicGenre":"genre musical","subtitleStyle":"bold","targetDurationMs":20000,"description":"description du style","textColor":"#FFFFFF","bgColor":"#0A0A0F","accentColor":"#3B82F6"}]`);
  if (Array.isArray(r) && r.length >= 2) return r;
  return [
    { id:"variant_a", name:"Rythme rapide", pace:"fast", colorFilter:"neutral", musicGenre:"hip-hop", subtitleStyle:"bold", targetDurationMs:20000, description:"Court et accrocheur avec cuts rapides", textColor:"#FFFFFF", bgColor:"#0A0A0F", accentColor:"#3B82F6" },
    { id:"variant_b", name:"Dramatique énergique", pace:"fast", colorFilter:"high_contrast", musicGenre:"cinématique", subtitleStyle:"dramatic", targetDurationMs:25000, description:"Effets visuels prononcés, tension maximum", textColor:"#FFFFFF", bgColor:"#0D0A00", accentColor:"#F97316" },
    { id:"variant_c", name:"Minimaliste direct", pace:"medium", colorFilter:"desaturated", musicGenre:"ambient", subtitleStyle:"minimal", targetDurationMs:30000, description:"Focus sur le texte, ambiance confiante", textColor:"#FFFFFF", bgColor:"#0A0F0A", accentColor:"#22C55E" },
  ];
}

async function hashtagAgent(apiKey, script) {
  const r = await callClaude(apiKey, `Analyse ce script TikTok et génère des hashtags ultra-ciblés:

SCRIPT: "${script}"

Crée des hashtags qui correspondent exactement au contenu et à la niche du script. Pense à la viralité et au ciblage précis.

JSON: {"viral":["#fyp","#pourtoi","#viral"],"trending":["#hashtag_tendance_lié_au_contenu"],"niche":["#hashtag_niche_précis"],"caption":"légende complète avec les meilleurs hashtags — max 150 caractères"}`);
  return r?.viral ? r : { viral:["#fyp","#pourtoi","#viral"], trending:["#tendance","#trending"], niche:["#contenu","#tiktokfr"], caption:script.slice(0,100)+" #fyp #pourtoi" };
}

export async function runAllAgents(apiKey, project, onProgress) {
  onProgress("Analyse du script en cours...", 5);
  const imageCount = project.images?.length || 0;

  onProgress("Les 4 agents analysent ton script...", 15);

  const [hook, segments, variants, hashtags] = await Promise.all([
    hookAgent(apiKey, project.script).then(r => { onProgress("✓ Hook créé depuis ton script", 35); return r; }),
    scriptAgent(apiKey, project.script, imageCount).then(r => { onProgress("✓ Script découpé en segments", 55); return r; }),
    variantAgent(apiKey, project.script).then(r => { onProgress("✓ 3 variantes de montage créées", 75); return r; }),
    hashtagAgent(apiKey, project.script).then(r => { onProgress("✓ Hashtags ciblés générés", 90); return r; }),
  ]);

  onProgress("Agents terminés — génération vidéo...", 100);
  return { hook, segments, variants, hashtags };
}
