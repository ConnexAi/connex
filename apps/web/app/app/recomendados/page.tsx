"use client";

import { useEffect, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function Recomendados() {
  const { activeOrgId } = useOrg();

  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1) obtener token backend una sola vez
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

  async function loadRecommended(orgId: string) {
    if (!token) return;

    const recRes = await fetch(`${API_BASE}/ai/recommended/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const recData = await recRes.json();
    if (!recRes.ok) throw new Error(recData?.message || "No recommended");
    setItems(recData);
  }

  // 2) cada vez que cambie activeOrgId, cargar lista
  useEffect(() => {
    if (!token || !activeOrgId) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        await loadRecommended(activeOrgId);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, activeOrgId]);

  // 3) Refresh: genera recomendados evaluando procesos
  async function refreshNow() {
    if (!token || !activeOrgId) return;

    try {
      setRefreshing(true);
      setErr(null);

      // Puedes ajustar esto luego desde UI:
      const body = {
        orgId: activeOrgId,
        limit: 30,
        offset: 0,
        threshold: 85,
      };

      const res = await fetch(`${API_BASE}/ai/recommendations/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Refresh failed");

      // Si el backend devuelve top, úsalo directo
      if (Array.isArray(data?.top)) {
        setItems(data.top);
      } else {
        // Si no, vuelve a pedir recomendados
        await loadRecommended(activeOrgId);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (err) {
    return (
      <div className="text-white/70">
        <div className="text-red-300 font-medium">Error</div>
        <div className="mt-2 whitespace-pre-line">{err}</div>
        <div className="mt-4 text-white/50 text-sm">
          Tip: verifica backend en <span className="underline">http://localhost:3000/docs</span>
        </div>
      </div>
    );
  }

  if (!token) return <div className="text-white/70">Inicia sesión para ver recomendados.</div>;
  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;
  if (loading) return <div className="text-white/70">Cargando recomendados…</div>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Licitaciones recomendadas</h1>
          <p className="mt-1 text-white/60 text-sm">Org: {activeOrgId}</p>
        </div>

        <button
          onClick={refreshNow}
          disabled={refreshing}
          className="rounded-xl px-4 py-2 text-sm bg-[#6a0000] hover:bg-[#6a0000]/90 disabled:opacity-60"
        >
          {refreshing ? "Actualizando..." : "Actualizar recomendados"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {items.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white/70">
            No hay recomendados aún. Dale a <b>Actualizar recomendados</b> para generar.
          </div>
        )}

        {items.map((x) => (
          <div key={x.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold break-words">{x.process?.title ?? "Proceso"}</div>
                <div className="mt-1 text-sm text-white/60">
                  {x.process?.entityName ?? "Entidad"} · {x.process?.location ?? "Ubicación"}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm text-white/70">Score</div>
                <div className="text-xl font-semibold">{x.score}</div>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-flex rounded-full bg-[#337ca0]/20 text-[#a9d3ea] px-3 py-1 text-xs">
                {x.decision}
              </span>
            </div>

            {x.explanation && (
              <div className="mt-3 text-sm text-white/70 whitespace-pre-line">
                {cleanupMarkdown(x.explanation)}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/app/licitaciones/${x.processId}`}
                className="rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/15"
              >
                Ver detalles
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Limpieza simple para quitar ** y mejorar lectura sin meter librerías
function cleanupMarkdown(text: string) {
  return text.replace(/\*\*/g, "");
}
