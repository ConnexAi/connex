"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type Conversation = {
  id: string;
  orgId: string;
  title: string;
  updatedAt: string;
  processId?: string | null;
};

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export default function DashboardChat() {
  const { activeOrgId } = useOrg();

  const [token, setToken] = useState<string | null>(null);

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [q, setQ] = useState("");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // token backend una vez
  useEffect(() => {
    (async () => {
      try {
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");
        setToken(tData.accessToken);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  async function loadConvs(orgId: string) {
    const res = await fetch(`${API_BASE}/ai/conversations/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "No conversations");

    const list = Array.isArray(data) ? data.slice(0, 10) : [];
    setConvs(list);
    return list;
  }

  async function loadMessages(conversationId: string) {
    const res = await fetch(`${API_BASE}/ai/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "No messages");
    setMsgs(Array.isArray(data) ? data : []);
  }

  async function createConversation(orgId: string) {
    const res = await fetch(`${API_BASE}/ai/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orgId, title: "Nuevo chat" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "No create conversation");
    return data as Conversation;
  }

  async function renameConversation(id: string, title: string) {
    const res = await fetch(`${API_BASE}/ai/conversations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "No rename");

    // refresca lista
    if (activeOrgId) await loadConvs(activeOrgId);
    return data;
  }

  // Cuando cambia org: carga conversaciones y selecciona la primera
  useEffect(() => {
    if (!token || !activeOrgId) return;

    (async () => {
      try {
        setError(null);
        setMsgs([]);
        setActiveConvId(null);

        const list = await loadConvs(activeOrgId);
        const first = list?.[0]?.id ?? null;

        if (first) {
          setActiveConvId(first);
          await loadMessages(first);
        } else {
          // si no hay chats, crea uno
          const created = await createConversation(activeOrgId);
          const updated = await loadConvs(activeOrgId);
          const newFirst = updated?.[0]?.id ?? created.id;

          setActiveConvId(newFirst);
          await loadMessages(newFirst);
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrgId]);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const filteredConvs = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return convs;
    return convs.filter((c) => c.title.toLowerCase().includes(s));
  }, [convs, q]);

  async function newChat() {
    if (!token || !activeOrgId) return;
    try {
      setError(null);
      const created = await createConversation(activeOrgId);
      const list = await loadConvs(activeOrgId);
      const id = list?.[0]?.id ?? created.id;

      setActiveConvId(id);
      await loadMessages(id);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function selectConv(id: string) {
    try {
      setError(null);
      setActiveConvId(id);
      await loadMessages(id);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function send() {
    if (!token || !activeOrgId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgId: activeOrgId,
          conversationId: activeConvId ?? undefined,
          message: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Chat failed");

      const cid = data.conversationId;
      if (!activeConvId) setActiveConvId(cid);

      // refrescar todo para quedar consistente con DB
      await loadConvs(activeOrgId);
      await loadMessages(cid);
    } catch (e: any) {
      setError(e.message);
      // intenta re-cargar mensajes si falla
      if (activeConvId) await loadMessages(activeConvId);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  if (!token) return <div className="text-white/70">Inicia sesión para usar el chat.</div>;
  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;

  const activeTitle = convs.find((c) => c.id === activeConvId)?.title ?? "Chat";

  return (
    <div className="h-[78vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm text-white/60">Connex AI</div>
          <div className="text-lg font-semibold truncate">{activeTitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThreads((v) => !v)}
            className="rounded-xl px-3 py-2 text-xs bg-white/10 hover:bg-white/15"
          >
            {showThreads ? "Ocultar chats" : "Mostrar chats"}
          </button>

          <div className="text-xs text-white/50">{sending ? "Escribiendo…" : "Listo"}</div>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-300 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
          {error}
        </div>
      )}

      {/* Body */}
      <div className={`grid gap-4 flex-1 min-h-0 ${showThreads ? "grid-cols-1 lg:grid-cols-[280px_1fr]" : "grid-cols-1"}`}>
        {/* Sidebar chats */}
        {showThreads && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Chats</div>
              <button
                onClick={newChat}
                className="rounded-xl px-3 py-2 text-xs bg-white/10 hover:bg-white/15"
              >
                + Nuevo
              </button>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar chats…"
              className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            />

            <div className="mt-3 space-y-2 overflow-y-auto pr-1 min-h-0">
              {filteredConvs.slice(0, 10).map((c) => (
                <ChatRow
                  key={c.id}
                  active={c.id === activeConvId}
                  title={c.title}
                  onClick={() => selectConv(c.id)}
                  onRename={(t) => renameConversation(c.id, t)}
                />
              ))}
            </div>

            <div className="mt-auto pt-3 text-xs text-white/40">Máximo 10 chats por empresa.</div>
          </div>
        )}

        {/* Chat */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col min-h-0">
          {/* Mensajes: SCROLL SOLO AQUÍ */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-black/10 border border-white/10 p-4 space-y-3 min-h-0">
            {msgs.length ? (
              msgs.map((m) => (
                <div
                  key={m.id}
                  className={[
                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                    m.role === "USER"
                      ? "ml-auto bg-white/10 border border-white/10"
                      : "mr-auto bg-white/5 border border-white/10",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60">
                Escribe tu primera pregunta. (Enter envía, Shift+Enter salto)
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input fijo abajo */}
          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe aquí…"
              className="flex-1 min-h-[44px] max-h-[140px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="rounded-2xl px-4 py-3 text-sm bg-white/10 hover:bg-white/15 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatRow({
  active,
  title,
  onClick,
  onRename,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  onRename: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(title);

  useEffect(() => setV(title), [title]);

  return (
    <div
      className={[
        "rounded-xl border px-3 py-2 cursor-pointer",
        active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10",
      ].join(" ")}
      onClick={onClick}
    >
      {!editing ? (
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm truncate">{title}</div>
          <button
            className="text-xs text-white/50 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            ✎
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={v}
            onChange={(e) => setV(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRename(v.trim() || "Chat");
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <button
            className="text-xs rounded-lg px-2 py-1 bg-white/10 hover:bg-white/15"
            onClick={() => {
              onRename(v.trim() || "Chat");
              setEditing(false);
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
