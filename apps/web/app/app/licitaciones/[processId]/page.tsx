"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useOrg } from "../../org-context";

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
  publishedAt?: string | null;
  externalId?: string | null;
  source?: string | null;
};

type ProcessDoc = {
  id: string;
  processId: string;
  type?: string | null; // PLIEGO, ANEXO, OTHER, etc.
  fileName: string;
  sourceUrl: string;
  createdAt?: string;
};

export default function ProcessDetailPage() {
  const params = useParams<{ processId: string }>();
  const processId = params.processId;

  const { activeOrgId } = useOrg();

  const [token, setToken] = useState<string | null>(null);
  const [proc, setProc] = useState<Process | null>(null);
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 1) obtener token backend (una vez)
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

  // 2) cargar proceso + documentos
  useEffect(() => {
    if (!token || !processId) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const pRes = await fetch(`${API_BASE}/processes/${processId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData?.message || "No process");
        setProc(pData);

        const dRes = await fetch(`${API_BASE}/processes/${processId}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dData = await dRes.json();
        if (!dRes.ok) throw new Error(dData?.message || "No documents");
        setDocs(Array.isArray(dData) ? dData : []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, processId]);

  const pliegoUrl = useMemo(() => {
    if (!docs.length) return null;

    // Prioridad: doc type PLIEGO (si existe)
    const pliego = docs.find((d) => (d.type ?? "").toUpperCase() === "PLIEGO");
    if (pliego?.sourceUrl) return pliego.sourceUrl;

    // Si no hay PLIEGO, toma el primer doc
    return docs[0].sourceUrl;
  }, [docs]);

  function openUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function evaluateWithAI() {
    if (!token || !activeOrgId) {
      alert("Selecciona una empresa (org) antes de evaluar.");
      return;
    }

    try {
      setErr(null);
      // Usa tu endpoint existente:
      // POST /ai/evaluate?orgId=...&processId=...
      const url = `${API_BASE}/ai/evaluate?orgId=${encodeURIComponent(activeOrgId)}&processId=${encodeURIComponent(processId)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No evaluate");

      alert(`Evaluado ✅ Score: ${data.score}`);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function saveProcess() {
    if (!token || !activeOrgId) {
      alert("Selecciona una empresa (org) antes de guardar.");
      return;
    }

    try {
      setErr(null);
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ processId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No save");
      alert("Guardado ✅");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (loading) return <div className="text-white/70">Cargando detalle…</div>;
  if (err) return <div className="text-red-300">Error: {err}</div>;
  if (!proc) return <div className="text-white/70">Proceso no encontrado.</div>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold break-words">{proc.title}</h1>
          <div className="mt-2 text-sm text-white/60">
            {proc.entityName ?? "Entidad"} · {proc.location ?? "Ubicación"} · {proc.status ?? "-"}
          </div>

          <div className="mt-2 text-xs text-white/50">
            {proc.amountCategory ?? "SIN_DEFINIR"} · {proc.modality ?? "-"} ·{" "}
            {typeof proc.amountCOP === "number"
              ? `$${Math.round(proc.amountCOP).toLocaleString("es-CO")} COP`
              : "—"}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={evaluateWithAI}
            className="rounded-xl px-4 py-2 text-sm bg-[#337ca0] hover:bg-[#337ca0]/90"
          >
            Evaluar con Connex AI
          </button>

          <button
            onClick={saveProcess}
            className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15"
          >
            Guardar
          </button>

          <button
            disabled={!pliegoUrl}
            onClick={() => pliegoUrl && openUrl(pliegoUrl)}
            className="rounded-xl px-4 py-2 text-sm bg-[#6a0000] hover:bg-[#6a0000]/90 disabled:opacity-60"
          >
            {pliegoUrl ? "Abrir/descargar pliego" : "Sin documentos"}
          </button>
        </div>
      </div>

      {/* Documentos */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="font-semibold">Documentos del proceso</div>
        <div className="mt-1 text-sm text-white/60">
          Abre el documento oficial (MVP). Luego añadimos descarga directa dentro de Connex.
        </div>

        <div className="mt-4 grid gap-2">
          {docs.length === 0 && (
            <div className="text-white/70">Este proceso no tiene documentos guardados todavía.</div>
          )}

          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => openUrl(d.sourceUrl)}
              className="text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium break-words">{d.fileName}</div>
                  <div className="text-xs text-white/50">
                    {d.type ?? "OTHER"}
                  </div>
                </div>
                <div className="text-xs text-white/60 shrink-0">Abrir</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Próximo: Chat contextual */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="font-semibold">Connex AI (proceso)</div>
        <div className="mt-2 text-sm text-white/60">
          Siguiente paso: chat contextual del proceso (conversación dedicada) + análisis profundo.
        </div>
      </div>
    </div>
  );
}

