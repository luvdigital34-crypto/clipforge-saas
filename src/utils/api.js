export function getApiKey() {
  const envKey = "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";
  if (envKey && envKey.startsWith("sk-")) return envKey;
  try {
    const raw = localStorage.getItem("clipforge-storage");
    if (raw) return JSON.parse(raw)?.state?.apiKey || null;
  } catch {}
  return null;
}

export async function callClaude({ system, messages, model = "claude-haiku-4-5-20251001", max_tokens = 1500 }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante — configure ta clé sur le Dashboard.");

  const res = await fetch("/api/claude/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erreur API ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}
