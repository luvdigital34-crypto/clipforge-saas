# ClipForge AI — Web App

Site web SaaS de montage TikTok automatisé par agents IA Claude.

## Lancer en 3 commandes

```bash
npm install
npm run dev
# Ouvre http://localhost:5173
```

## Configuration

1. Va sur https://console.anthropic.com → API Keys → Create Key
2. Dans l'app : Paramètres → colle ta clé → Sauvegarder

## Stack

- **React + Vite** — frontend rapide
- **React Router** — navigation SPA
- **Zustand** — état global persisté
- **Claude Haiku API** — 4 agents IA en parallèle
- **FFmpeg WASM** — montage vidéo dans le navigateur

## Déploiement (Vercel)

```bash
npm run build
# Dépose le dossier dist/ sur Vercel, Netlify, ou n'importe quel hébergeur statique
```

**Important pour le déploiement :** ajoute ces headers HTTP (requis par FFmpeg WASM) :
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Sur Vercel, crée un fichier `vercel.json` :
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```
