"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function PerfilPage() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");
        setToken(tData.accessToken);

        const res = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${tData.accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No /me");
        setMe(data);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  if (!token) return <div className="text-white/70">Inicia sesión.</div>;
  if (err) return <div className="text-red-300">Error: {err}</div>;
  if (!me) return <div className="text-white/70">Cargando…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-white/60">Perfil</div>
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="text-sm text-white/60">Nombre</div>
        <div className="text-lg font-semibold">{me.user?.name ?? "—"}</div>

        <div className="mt-4 text-sm text-white/60">Email</div>
        <div className="text-lg font-semibold">{me.user?.email ?? "—"}</div>

        <div className="mt-4 text-xs text-white/50">
          (MVP) Editar nombre lo agregamos con endpoint PATCH /me en el siguiente sprint.
        </div>
      </div>
    </div>
  );
}
