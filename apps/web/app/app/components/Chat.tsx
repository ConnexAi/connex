"use client";

import { useEffect, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type Msg = { role: "USER" | "ASSISTANT"; content: string };

export default function Chat() {
  const { activeOrgId } = useOrg();
  const [token, setToken] = useState<string | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // token backend
  useEffect(() => {
    (async () => {
      try {
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");
        setToken(tData.accessToken);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  // cargar conversaciones y mensajes cuando cambia org
  useEffect(() => {
    if (!token || !activeOrgId) return;

    (async () => {
      try {
        setErr(null);
        setMessages([]);
        setConversationId(null);

        // 1) lista conversaciones de la org
        const cRes = await fetch(`${API_BASE}/ai/conversations/${activeOrgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cData = await cRes.json();
        if (!cRes.ok) throw new Error(cData?.message || "No conversations");

        const first = Array.isArray(cData) && cData.length ? cData[0] : null;
        if (!first) return; // no hay historial

        setConversationId(first.id);

        // 2) trae mensajes de esa conversación
        const mRes = await fetch(`${API_BASE}/ai/conversations/${first.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mData = await mRes.json();
        if (!mRes.ok) throw new Error(mData?.message || "No messages");

        const mapped: Msg[] = Array.isArray(mData)
          ? mData.map((x: any) => ({ role: x.role, content: x.content }))
          : [];

        setMessages(mapped);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [token, activeOrgId]);

  async function send() {
    if (!token || !activeOrgId) return;
    const text = input.trim();
    if (!text) return;

    setLoading(true);
    setErr(null);

    // optimista: agrega el mensaje del usuario
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    setInput("");

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId: activeOrgId,
          message: text,
          conversationId: conversationId ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Chat failed");

      // backend devuelve { conversationId, answer, ... }
      if (!conversationId && data.conversationId) setConversationId(data.conversationId);

      setMessages((prev) => [...prev, { role: "ASSISTANT", content: data.answer }]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!token) return <div className="text-white/70">Inicia sesión para usar Connex AI.</div>;
  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col h-[520px]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-white/60">Connex AI</div>
          <div className="text-lg font-semibold">Chat</div>
        </div>
        <div className="text-xs text-white/50">
          {conversationId ? `Conv: ${conversationId.slice(0, 8)}…` : "Sin conversación"}
        </div>
      </div>

      {err && <div className="mb-3 text-red-300 text-sm">Error: {err}</div>}

      <div className="flex-1 space-y-3 overflow-auto pr-2">
        {messages.length === 0 && (
          <div className="text-sm text-white/60">
            Escribe tu primera pregunta a Connex AI.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm whitespace-pre-line ${
              m.role === "ASSISTANT" ? "text-white" : "text-white/70"
            }`}
          >
            <b>{m.role === "ASSISTANT" ? "Connex AI" : "Tú"}:</b> {m.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-2 bg-white/10 border border-white/10 text-sm outline-none"
          placeholder="Pregúntale a Connex AI…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-[#337ca0] hover:bg-[#337ca0]/90 text-sm disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
