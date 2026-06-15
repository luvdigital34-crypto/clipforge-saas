/**
 * videoEngine.js — Montage vidéo avec FFmpeg WebAssembly
 * Tourne entièrement dans le navigateur, zéro serveur
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg = null;
let ffmpegLoaded = false;

export async function loadFFmpeg(onProgress) {
  if (ffmpegLoaded) return;

  ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    // console.log("[FFmpeg]", message);
  });

  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) onProgress(Math.round(progress * 100));
  });

  // Charge FFmpeg WASM depuis le CDN
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
}

// ── Crée une slide vidéo à partir d'une image ─────────────────────────────────
async function imageToClip(imageFile, durationSec, subtitleText, colorFilter, index) {
  const inputName = `img_${index}.jpg`;
  const outputName = `clip_${index}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

  const filterParts = [
    // Scale + crop TikTok 9:16
    `scale=1080:1920:force_original_aspect_ratio=increase`,
    `crop=1080:1920`,
    // Filtre couleur
    colorFilter === "warm" ? "eq=saturation=1.2:contrast=1.1" :
    colorFilter === "dark" ? "eq=saturation=0.85:contrast=1.3:brightness=-0.05" :
    colorFilter === "vibrant" ? "eq=saturation=1.5:contrast=1.1" :
    "eq=saturation=1.0:contrast=1.05",
    // Zoom léger
    `zoompan=z='min(zoom+0.0015,1.2)':d=${Math.round(durationSec * 25)}:s=1080x1920`,
  ].join(",");

  // Sous-titre
  const sub = subtitleText?.replace(/'/g, "").replace(/:/g, "") || "";
  const subtitleFilter = sub
    ? `,drawtext=text='${sub}':fontsize=46:fontcolor=white:borderw=3:bordercolor=black:bold=1:x=(w-text_w)/2:y=h-200`
    : "";

  await ffmpeg.exec([
    "-loop", "1",
    "-i", inputName,
    "-t", String(durationSec),
    "-vf", `${filterParts}${subtitleFilter}`,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-y", outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return data;
}

// ── Crée le clip de hook (texte animé centré) ─────────────────────────────────
async function createHookClip(imageFile, hookText, durationSec) {
  const inputName = `hook_img.jpg`;
  const outputName = `hook_clip.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(imageFile));

  const text = hookText.replace(/'/g, "").replace(/:/g, "");

  await ffmpeg.exec([
    "-loop", "1",
    "-i", inputName,
    "-t", String(durationSec),
    "-vf", [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      "crop=1080:1920",
      "eq=contrast=1.2:brightness=-0.1",
      `zoompan=z='min(zoom+0.003,1.3)':d=${Math.round(durationSec * 25)}:s=1080x1920`,
      `drawtext=text='${text}':fontsize=64:fontcolor=white:borderw=5:bordercolor=black:bold=1:x=(w-text_w)/2:y=(h-text_h)/3`,
    ].join(","),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-y", outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  return data;
}

// ── Concatène tous les clips en une vidéo finale ──────────────────────────────
async function concatClips(clipDataArray) {
  // Écrit tous les clips
  const clipNames = [];
  for (let i = 0; i < clipDataArray.length; i++) {
    const name = `concat_${i}.mp4`;
    await ffmpeg.writeFile(name, clipDataArray[i]);
    clipNames.push(name);
  }

  // Fichier liste pour concat
  const listContent = clipNames.map((n) => `file '${n}'`).join("\n");
  await ffmpeg.writeFile("list.txt", listContent);

  await ffmpeg.exec([
    "-f", "concat",
    "-safe", "0",
    "-i", "list.txt",
    "-c", "copy",
    "-y", "final.mp4",
  ]);

  const finalData = await ffmpeg.readFile("final.mp4");

  // Nettoyage
  for (const name of clipNames) await ffmpeg.deleteFile(name);
  await ffmpeg.deleteFile("list.txt");
  await ffmpeg.deleteFile("final.mp4");

  return finalData;
}

// ── Render principal ──────────────────────────────────────────────────────────
export async function renderVariant(images, segments, hook, variant, onProgress) {
  try {
    onProgress(5);

    const clips = [];

    // 1. Clip de hook
    const hookDur = (hook.hookDuration || 2500) / 1000;
    const hookClip = await createHookClip(images[0], hook.hookText, hookDur);
    clips.push(hookClip);
    onProgress(20);

    // 2. Segments
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const img = images[seg.imageIndex % images.length];
      const dur = (seg.durationMs || 3000) / 1000;

      // Ajuste durée selon le pace de la variante
      const adjustedDur =
        variant.pace === "fast" ? Math.min(dur, 2.5) :
        variant.pace === "slow" ? Math.max(dur, 4) : dur;

      const clip = await imageToClip(img, adjustedDur, seg.subtitleText, variant.colorFilter, i);
      clips.push(clip);
      onProgress(20 + Math.round((i / segments.length) * 60));
    }

    // 3. Concat
    onProgress(82);
    const finalData = await concatClips(clips);
    onProgress(100);

    // Retourne une URL blob téléchargeable
    const blob = new Blob([finalData.buffer], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const sizeMB = (blob.size / 1024 / 1024).toFixed(1);

    return { success: true, url, sizeMB };
  } catch (err) {
    console.error("Render error:", err);
    return { success: false, error: String(err) };
  }
}
