"use client";

import { useEffect, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function DashboardWidgets() {
  const { activeOrgId } = useOrg();
  const [token, setToken] = useState<string | null>(null);

  const [recommended, setRecommended] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const tRes = await fetch("/api/backend/token", { cache: "no-store" });
      const tData = await tRes.json();
      if (tRes.ok) setToken(tData.accessToken);
    })();
  }, []);

  async function loadAll() {
    if (!token || !activeOrgId) return;
    setLoading(true);

    try {
      // onboarding status
      const oRes = await fetch(`${API_BASE}/orgs/${activeOrgId}/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const oData = await oRes.json();
      if (oRes.ok) setOnboarding(oData);

      // top recommended (solo 3)
      const rRes = await fetch(`${API_BASE}/ai/recommended/${activeOrgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rData = await rRes.json();
      if (rRes.ok) setRecommended(Array.isArray(rData) ? rData.slice(0, 3) : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrgId]);

  return (
    <div className="space-y-4">
      {/* Estado empresa (compacto) */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-sm font-semibold">Estado de la empresa</div>

        {loading ? (
          <div className="mt-2 text-sm text-white/60">Cargando...</div>
        ) : onboarding ? (
          <div className="mt-2 text-sm text-white/70">
            {onboarding.isReady ? (
              <div className="text-emerald-200">✅ Lista para recomendar y postular</div>
            ) : (
              <>
                <div className="text-yellow-200">⚠️ Falta completar:</div>
                <ul className="mt-2 list-disc pl-5 text-white/60 space-y-1">
                  {(onboarding.missing ?? []).slice(0, 4).map((x: string) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>

                <a
                  href="/app/empresa"
                  className="inline-flex mt-3 rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/15"
                >
                  Completar ahora
                </a>
              </>
            )}
          </div>
        ) : (
          <div className="mt-2 text-sm text-white/60">No se pudo leer onboarding.</div>
        )}
      </div>

      {/* Top recomendados (solo 3) */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-sm font-semibold">Top recomendados</div>

        {loading ? (
          <div className="mt-2 text-sm text-white/60">Cargando...</div>
        ) : recommended.length === 0 ? (
          <div className="mt-2 text-sm text-white/60">No hay recomendados aún.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {recommended.map((x) => (
              <a
                key={x.id}
                href={`/app/licitaciones/${x.processId}`}
                className="block rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium break-words">
                      {x.process?.title ?? "Proceso"}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {x.process?.entityName ?? "Entidad"} · {x.process?.location ?? "Ubicación"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/60">Score</div>
                    <div className="text-lg font-semibold">{x.score}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
