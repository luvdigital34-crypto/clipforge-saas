import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "10mb" }));

// Headers CORS pour toutes les requêtes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key, anthropic-version, anthropic-beta");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Proxy Anthropic
app.post("/api/anthropic/v1/messages", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(400).json({ error: "Clé API manquante" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy Anthropic actif sur http://localhost:${PORT}`));
