"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type Process = {
  id: string;
  title: string;
  entityName?: string | null;
  location?: string | null;
  modality?: string | null;
  status?: string | null;
  amountCOP?: number | null;
  amountCategory?: string | null;
};

type ListResp = {
  items: Process[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export default function Licitaciones() {
  const { activeOrgId } = useOrg();
  const [token, setToken] = useState<string | null>(null);

  const [items, setItems] = useState<Process[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filtros (server-side)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [amountCategory, setAmountCategory] = useState("ALL");
  const [location, setLocation] = useState("ALL");

  // paginación real
  const [pageSize, setPageSize] = useState<number>(30);
  const [page, setPage] = useState<number>(1);

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

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setErr(null);

      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      if (q.trim()) params.set("q", q.trim());
      if (status !== "ALL") params.set("status", status);
      if (amountCategory !== "ALL") params.set("amountCategory", amountCategory);
      if (location !== "ALL") params.set("location", location);

      const res = await fetch(`${API_BASE}/processes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ListResp = await res.json();
      if (!res.ok) throw new Error((data as any)?.message || "No processes");

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setHasMore(Boolean(data.hasMore));
    } catch (e: any) {
      setErr(e.message);
      setItems([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // recargar cuando cambian filtros/paginación
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pageSize, offset, q, status, amountCategory, location]);

  // cuando cambian filtros o pageSize: volver a página 1
  useEffect(() => {
    setPage(1);
  }, [q, status, amountCategory, location, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  if (err) return <div className="text-red-300">Error: {err}</div>;
  if (!token) return <div className="text-white/70">Inicia sesión para ver licitaciones.</div>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Licitaciones</h1>
          <p className="mt-1 text-white/60 text-sm">
            Lista general con paginación. {activeOrgId ? `Empresa activa: ${activeOrgId.slice(0, 8)}…` : ""}
          </p>
        </div>
      </div>

      {/* filtros + paginación arriba */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-6 gap-3 items-end">
        <div className="lg:col-span-2">
          <div className="text-xs text-white/60 mb-1">Buscar</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Título, entidad o ciudad..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Estado</div>
          <input
            value={status === "ALL" ? "" : status}
            onChange={(e) => setStatus(e.target.value ? e.target.value : "ALL")}
            placeholder="Ej: PUBLISHED, OPEN..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Cuantía</div>
          <select
            value={amountCategory}
            onChange={(e) => setAmountCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="ALL" className="bg-[#0b1c2d] text-white">Todas</option>
            <option value="MINIMA_CUANTIA" className="bg-[#0b1c2d] text-white">Mínima</option>
            <option value="MENOR_CUANTIA" className="bg-[#0b1c2d] text-white">Menor</option>
            <option value="MAYOR_CUANTIA" className="bg-[#0b1c2d] text-white">Mayor</option>
            <option value="SIN_DEFINIR" className="bg-[#0b1c2d] text-white">Sin definir</option>
          </select>
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Ubicación</div>
          <input
            value={location === "ALL" ? "" : location}
            onChange={(e) => setLocation(e.target.value ? e.target.value : "ALL")}
            placeholder="Ej: Bogotá"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <div className="text-xs text-white/60 mb-1">Mostrar</div>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
          >
            {[15, 30, 50].map((n) => (
              <option key={n} value={n} className="bg-[#0b1c2d] text-white">
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* contador + nav */}
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/70">
        <div>
          Mostrando <span className="text-white">{total === 0 ? 0 : offset + 1}</span>–
          <span className="text-white">{Math.min(offset + items.length, total)}</span> de{" "}
          <span className="text-white">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            Anterior
          </button>

          <div className="text-white/70">
            {page} / {totalPages}
          </div>

          <button
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* lista */}
      <div className="mt-5 grid gap-4">
        {loading && <div className="text-white/60">Cargando…</div>}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white/70">
            No hay resultados con esos filtros.
          </div>
        )}

        {items.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold break-words">{p.title}</div>
                <div className="mt-1 text-sm text-white/60">
                  {p.entityName ?? "Entidad"} · {p.location ?? "Ubicación"}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  {p.amountCategory ?? "SIN_DEFINIR"} · {p.status ?? "-"} · {p.modality ?? "-"}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-white/60">Cuantía</div>
                <div className="text-sm font-semibold">
                  {typeof p.amountCOP === "number" ? `$${Math.round(p.amountCOP).toLocaleString("es-CO")} COP` : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`/app/licitaciones/${p.id}`}
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
