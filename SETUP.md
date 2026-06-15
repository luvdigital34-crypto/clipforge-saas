# ClipForge AI — SaaS Setup Guide

## Stack
- React + Vite (frontend)
- Supabase (auth + base de données) — GRATUIT
- Paiement USDC sur Polygon
- Claude Haiku API (agents IA)

---

## Étape 1 — Créer ton projet Supabase (gratuit)

1. Va sur https://supabase.com et crée un compte
2. Clique "New Project"
3. Donne un nom : "clipforge"
4. Choisis un mot de passe pour la DB
5. Région : Europe (West)
6. Attends 2 minutes que le projet se crée

Une fois créé :
- Va dans Settings > API
- Copie "Project URL" → c'est ton VITE_SUPABASE_URL
- Copie "anon public" → c'est ton VITE_SUPABASE_ANON_KEY

---

## Étape 2 — Créer les tables dans Supabase

1. Dans Supabase, clique sur "SQL Editor" dans le menu
2. Clique "New Query"
3. Copie-colle tout le contenu du fichier supabase-schema.sql
4. Clique "Run"
5. Tu dois voir "Success"

---

## Étape 3 — Configure ton adresse USDC

Dans le fichier src/pages/Pricing.jsx, ligne 8 :
Remplace YOUR_USDC_ADDRESS par ton adresse Ethereum/Polygon.

Pour recevoir des paiements USDC sur Polygon :
- Crée un wallet sur MetaMask (metamask.io)
- Copie ton adresse publique (0x...)
- Colle-la dans Pricing.jsx

---

## Étape 4 — Configure le .env

Copie .env.example en .env :
  copy .env.example .env

Puis remplis les valeurs dans .env :
  VITE_ANTHROPIC_API_KEY=ta-clé-anthropic
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...

---

## Étape 5 — Lance l'app

  npm install
  npm run dev

Ouvre http://localhost:5173

---

## Étape 6 — Mettre en ligne (optionnel)

1. Crée un compte sur https://vercel.com
2. Installe Vercel CLI : npm install -g vercel
3. Dans le dossier du projet : vercel
4. Ajoute tes variables d'env dans Vercel Dashboard > Settings > Environment Variables

---

## Flux de paiement USDC

1. L'utilisateur choisit un plan (Pro 19 USDC ou Illimité 49 USDC)
2. L'app affiche ton adresse USDC Polygon
3. L'utilisateur envoie les USDC depuis son wallet
4. Il copie le hash de transaction (TX Hash)
5. Il le colle dans l'app et confirme
6. Son plan est activé immédiatement

Note : pour une vérification automatique on-chain, il faudra
intégrer l'API Polygonscan (gratuit) — demande à Claude si tu veux l'ajouter.
