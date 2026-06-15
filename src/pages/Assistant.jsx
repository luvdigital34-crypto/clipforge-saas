import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import { callClaude } from "../utils/api.js";

const SYSTEM_PROMPT = `Tu es un assistant IA expert intégré dans ClipForge AI, une plateforme pour les entrepreneurs du resell et du contenu TikTok.

Tu aides avec :
- Resell sur Vinted, Vestiaire Collective, Chrono24, eBay (annonces, prix, négociation)
- Création de vidéos TikTok (scripts, hooks, hashtags)
- Comptabilité et calcul de marges/bénéfices
- Stratégies business et marketing
- N'importe quelle autre question

Tu réponds en français, de façon naturelle et directe comme un ami expert.`;

const SUGGESTIONS = [
  "Rédige une annonce Vinted pour une Nike Air Force 1 achetée 40€, vendue 75€",
  "Calcule ma marge si j'achète à 120€ et vends à 210€ avec 5% de frais",
  "Génère un script TikTok viral pour promouvoir mes sneakers",
  "Comment négocier avec un acheteur qui propose un prix trop bas ?",
  "Rédige un message à envoyer 1 min après qu'un article est mis en favoris",
];

export default function Assistant() {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Salut ${profile?.email?.split("@")[0] || "toi"} ! 👋 Je suis ton assistant IA expert resell & TikTok. Qu'est-ce que tu veux faire ?`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput(""); setError("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude({
        system: SYSTEM_PROMPT,
        messages: history,
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
      });
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${err.message}` }]);
    } finally { setLoading(false); }
  };

  const fmt = (text) => text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)" }}>
      <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--border)", background: "#111118", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: "#1A1A1A", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant IA</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Expert resell · TikTok · Business</div>
        </div>
        <div style={{ marginLeft: "auto", width: 8, height: 8, background: "#34C759", borderRadius: "50%" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 14, background: "var(--bg)" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, background: "#1A1A1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: "#111118",
              color: "#F0F0FF",
              fontSize: 14, lineHeight: 1.6,
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
            }} dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ width: 28, height: 28, background: "#1A1A1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <div style={{ padding: "12px 16px", background: "#111118", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, background: "#999", borderRadius: "50%", animation: `bounce 1s infinite ${i*0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div style={{ padding: "0 28px 12px", display: "flex", gap: 8, flexWrap: "wrap", background: "var(--bg)" }}>
          {SUGGESTIONS.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ padding: "6px 12px", background: "#111118", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, cursor: "pointer", color: "var(--text2)" }}>
              {s.slice(0, 45)}...
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 28px 20px", background: "#111118", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pose ta question... (Entrée pour envoyer)"
            rows={2}
            style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 14, resize: "none", fontFamily: "inherit" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width: 42, height: 42, background: loading || !input.trim() ? "var(--border)" : "#1A1A1A", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 18, color: "white" }}>
            ➤
          </button>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
