/**
 * canvasRenderer.js — Rendu vidéo pro avec Canvas + MediaRecorder
 * Montage dynamique basé sur le script analysé par l'IA
 */

export async function renderVideoFromData({ variant, hook, segments, hashtags, images, script }) {
  return new Promise(async (resolve, reject) => {
    try {
      const W = 1080, H = 1920;
      const FPS = 30;
      const segList = Array.isArray(segments) ? segments : [];
      const totalDuration = variant.targetDurationMs || 30000;

      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Charge les images
      const loadedImages = await Promise.all(
        (images || []).slice(0, 10).map(url => loadImage(url).catch(() => null))
      );
      const validImages = loadedImages.filter(Boolean);

      // Couleurs du variant
      const bgColor = variant.bgColor || "#0A0A0F";
      const accentColor = variant.accentColor || "#3B82F6";
      const isFast = variant.pace === "fast";

      // MediaRecorder
      const stream = canvas.captureStream(FPS);
      const chunks = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve({ blob, url: URL.createObjectURL(blob) });
      };
      recorder.start(100);

      const startTime = performance.now();
      let lastSegIdx = -1;
      let segStartTime = 0;
      let imgOffset = { x: 0, y: 0 };

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        const t = elapsed / 1000;

        // Segment actuel basé sur le timing
        const segDuration = totalDuration / Math.max(segList.length, 1);
        const segIdx = Math.min(Math.floor(elapsed / segDuration), segList.length - 1);
        const seg = segList[segIdx] || null;
        const segProgress = (elapsed % segDuration) / segDuration;

        // Nouvel effet de transition au changement de segment
        if (segIdx !== lastSegIdx) {
          lastSegIdx = segIdx;
          segStartTime = elapsed;
          imgOffset = { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 20 };
        }
        const transProgress = Math.min((elapsed - segStartTime) / 300, 1); // 300ms transition

        // ── FOND ──
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        // ── IMAGE DE FOND ──
        const imgIdx = seg?.imageIndex ?? (segIdx % Math.max(validImages.length, 1));
        const img = validImages[imgIdx % validImages.length];
        if (img) {
          ctx.save();
          ctx.globalAlpha = 0.55 * transProgress;
          // Ken Burns effect — zoom lent
          const zoom = 1 + (t * 0.008) % 0.08;
          const ox = imgOffset.x * (1 - transProgress);
          const oy = imgOffset.y * (1 - transProgress);
          drawCover(ctx, img, ox, oy, W, H, zoom);
          ctx.restore();
        }

        // ── OVERLAY GRADIENT ──
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(0,0,0,0.75)");
        grad.addColorStop(0.4, "rgba(0,0,0,0.15)");
        grad.addColorStop(0.7, "rgba(0,0,0,0.3)");
        grad.addColorStop(1, "rgba(0,0,0,0.92)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── HOOK (premières 3 secondes) ──
        if (elapsed < 3000) {
          const hp = elapsed / 3000;
          const hookScale = 1 + Math.sin(t * 3) * 0.015;
          ctx.save();
          ctx.translate(W / 2, H * 0.32);
          ctx.scale(hookScale, hookScale);
          ctx.globalAlpha = Math.min(hp * 4, 1);

          // Badge accent
          const hookW = W * 0.82, hookH = 130;
          ctx.fillStyle = accentColor;
          roundRect(ctx, -hookW/2, -hookH/2, hookW, hookH, 20);
          ctx.fill();

          // Texte hook
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `900 ${Math.min(76, W * 0.072)}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 8;
          fitText(ctx, (hook?.hookText || "").toUpperCase(), hookW * 0.9, 0, 0);
          ctx.restore();
        }

        // ── NUMÉRO DE SEGMENT (indicateur de progression) ──
        if (segList.length > 1 && elapsed > 3000) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          const dotW = segList.length * 24 + (segList.length - 1) * 8;
          const startX = W/2 - dotW/2;
          segList.forEach((_, i) => {
            ctx.beginPath();
            ctx.arc(startX + i * 32, H * 0.08, i === segIdx ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = i === segIdx ? accentColor : "rgba(255,255,255,0.4)";
            ctx.fill();
          });
          ctx.restore();
        }

        // ── TEXTE DU SEGMENT (sous-titres) ──
        if (seg && elapsed > 1500) {
          const textAlpha = Math.min((elapsed - 1500) / 500, 1) * transProgress;
          ctx.save();
          ctx.globalAlpha = textAlpha;

          const textY = H * 0.72;
          const boxW = W * 0.88, boxH = 200;

          // Fond du texte
          ctx.fillStyle = "rgba(0,0,0,0.78)";
          roundRect(ctx, W*0.06, textY - boxH/2, boxW, boxH, 16);
          ctx.fill();

          // Ligne accent
          ctx.fillStyle = accentColor;
          ctx.fillRect(W*0.06, textY - boxH/2, 6, boxH);

          // Sous-titre principal
          ctx.fillStyle = "#FFFFFF";
          ctx.font = `700 ${isFast ? 54 : 50}px -apple-system, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 6;
          wrapTextCentered(ctx, seg.subtitleText || seg.text || "", W/2, textY, boxW * 0.88, 62);

          // Texte complet plus petit en dessous
          if (seg.text && seg.text !== seg.subtitleText) {
            ctx.globalAlpha = textAlpha * 0.6;
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = `400 34px -apple-system, system-ui, sans-serif`;
            wrapTextCentered(ctx, seg.text, W/2, textY + 80, boxW * 0.85, 40);
          }
          ctx.restore();
        }

        // ── HASHTAGS (dernières 3 secondes) ──
        if (elapsed > totalDuration - 3500) {
          const hashAlpha = Math.min((elapsed - (totalDuration - 3500)) / 500, 1);
          ctx.save();
          ctx.globalAlpha = hashAlpha;
          ctx.fillStyle = "rgba(0,0,0,0.88)";
          ctx.fillRect(0, H - 220, W, 220);
          ctx.fillStyle = accentColor;
          ctx.font = "bold 38px -apple-system, sans-serif";
          ctx.textAlign = "center";
          const tags = [
            ...(hashtags?.viral || []).slice(0, 3),
            ...(hashtags?.niche || []).slice(0, 2)
          ].join(" ");
          wrapTextCentered(ctx, tags, W/2, H - 130, W * 0.9, 44);
          ctx.restore();
        }

        // ── BARRE DE PROGRESSION ──
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(0, H - 6, W, 6);
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, H - 6, W * progress, 6);

        // ── WATERMARK ──
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 28px -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("ClipForge AI", W - 24, 60);
        ctx.restore();

        if (elapsed < totalDuration) {
          requestAnimationFrame(animate);
        } else {
          recorder.stop();
        }
      };

      requestAnimationFrame(animate);
    } catch (err) { reject(err); }
  });
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function drawCover(ctx, img, ox, oy, w, h, zoom = 1) {
  const ratio = Math.max(w / img.width, h / img.height) * zoom;
  const nw = img.width * ratio, nh = img.height * ratio;
  ctx.drawImage(img, ox + (w - nw) / 2, oy + (h - nh) / 2, nw, nh);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fitText(ctx, text, maxW, x, y) {
  let size = 76;
  ctx.font = `900 ${size}px -apple-system, sans-serif`;
  while (ctx.measureText(text).width > maxW && size > 30) {
    size -= 4;
    ctx.font = `900 ${size}px -apple-system, sans-serif`;
  }
  ctx.fillText(text, x, y);
}

function wrapTextCentered(ctx, text, x, y, maxW, lineH) {
  if (!text) return;
  const words = text.split(" ");
  let line = "", lines = [];
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim()); line = w + " ";
    } else { line = test; }
  }
  if (line) lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));
}
