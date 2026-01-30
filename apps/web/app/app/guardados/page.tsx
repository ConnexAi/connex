"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type SavedRow = {
  id: string;
  orgId?: string;
  processId: string;
  createdAt?: string;
  process?: {
    id: string;
    title: string;
    entityName?: string | null;
    location?: string | null;
    amountCategory?: string | null;
  };
};

export default function GuardadosPage() {
  const { activeOrgId } = useOrg();
  const [token, setToken] = useState<string | null>(null);

  const [items, setItems] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState<string>("ALL");

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

  async function load() {
    if (!token || !activeOrgId) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No saved");

      // Asegura array
      const rows: SavedRow[] = Array.isArray(data) ? data : [];

      // Si no viene process, lo buscamos 1 a 1 (MVP)
      const missing = rows.filter((r) => !r.process);
      if (missing.length > 0) {
        const filled = await Promise.all(
          rows.map(async (r) => {
            if (r.process) return r;
            const pRes = await fetch(`${API_BASE}/processes/${r.processId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const pData = await pRes.json();
            if (!pRes.ok) return r;
            return { ...r, process: pData };
          })
        );
        setItems(filled);
      } else {
        setItems(rows);
      }
    } catch (e: any) {
      setErr(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // recargar cuando cambia org
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrgId]);

  async function remove(processId: string) {
    if (!token || !activeOrgId) return;
    try {
      await fetch(`${API_BASE}/orgs/${activeOrgId}/saved/${processId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((x) => x.processId !== processId));
    } catch (e) {
      // no bloqueamos UI
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((x) => {
      const title = (x.process?.title ?? "").toLowerCase();
      const ent = (x.process?.entityName ?? "").toLowerCase();
      const loc = (x.process?.location ?? "").toLowerCase();

      const matchesQ = !query || title.includes(query) || ent.includes(query) || loc.includes(query);

      const cat = x.process?.amountCategory ?? "SIN_DEFINIR";
      const matchesAmount = amount === "ALL" || cat === amount;

      return matchesQ && matchesAmount;
    });
  }, [items, q, amount]);

  if (!token) return <div className="text-white/70">Inicia sesión para ver guardados.</div>;
  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Guardados</h1>
          <p className="mt-1 text-white/60 text-sm">Org: {activeOrgId}</p>
        </div>

        <button
          onClick={load}
          className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15"
        >
          Recargar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título, entidad o ciudad..."
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
        />

        <select
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
        >
          <option value="ALL" className="bg-[#0b1c2d] text-white">Todas las cuantías</option>
          <option value="MINIMA_CUANTIA" className="bg-[#0b1c2d] text-white">Mínima</option>
          <option value="MENOR_CUANTIA" className="bg-[#0b1c2d] text-white">Menor</option>
          <option value="MAYOR_CUANTIA" className="bg-[#0b1c2d] text-white">Mayor</option>
          <option value="SIN_DEFINIR" className="bg-[#0b1c2d] text-white">Sin definir</option>
        </select>

        <div className="text-sm text-white/60 flex items-center">
          {loading ? "Cargando..." : `${filtered.length} guardados`}
        </div>
      </div>

      {err && <div className="mt-4 text-red-300">Error: {err}</div>}

      <div className="mt-6 grid gap-4">
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white/70">
            No tienes guardados con estos filtros.
          </div>
        )}

        {filtered.map((x) => (
          <div key={x.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold break-words">{x.process?.title ?? x.processId}</div>
                <div className="mt-1 text-sm text-white/60">
                  {x.process?.entityName ?? "Entidad"} · {x.process?.location ?? "Ubicación"}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  {x.process?.amountCategory ?? "SIN_DEFINIR"}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <a
                  href={`/app/licitaciones/${x.processId}`}
                  className="rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-center"
                >
                  Ver
                </a>
                <button
                  onClick={() => remove(x.processId)}
                  className="rounded-xl px-3 py-2 text-sm bg-[#6a0000] hover:bg-[#6a0000]/90"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
