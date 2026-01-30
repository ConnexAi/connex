"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import OrgSelector from "./components/OrgSelector";
import { OrgProvider } from "./org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [collapsed, setCollapsed] = useState(false);

  // auto-colapsar solo en Dashboard
  useEffect(() => {
    if (pathname === "/app" || pathname === "/app/") setCollapsed(true);
    else setCollapsed(false);
  }, [pathname]);

  useEffect(() => {
    (async () => {
      try {
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");
        const token = tData.accessToken;

        const meRes = await fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        if (!meRes.ok) throw new Error(meData?.message || "No /me");

        setOrgs(meData?.orgs ?? []);
      } catch {
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <OrgProvider>
      <div className="min-h-screen bg-[#0b1c2d] text-white">
        {/* FULL WIDTH: sin mx-auto/max-w */}
        <div
          className={[
            "grid gap-6 p-6",
            collapsed ? "grid-cols-[76px_1fr]" : "grid-cols-[260px_1fr]",
          ].join(" ")}
        >
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white/5 border border-white/10 p-4 h-[calc(100vh-48px)] sticky top-6">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xl font-semibold tracking-tight">
                {collapsed ? "C" : "connex"}
              </div>

              <button
                onClick={() => setCollapsed((v) => !v)}
                className="rounded-xl px-2 py-1 text-xs bg-white/10 hover:bg-white/15"
                title={collapsed ? "Expandir" : "Colapsar"}
              >
                {collapsed ? "»" : "«"}
              </button>
            </div>

            <nav className="mt-6 space-y-1 text-sm">
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app">
                {collapsed ? "🏠" : "Dashboard"}
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app/licitaciones">
                {collapsed ? "📄" : "Licitaciones"}
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app/recomendados">
                {collapsed ? "⭐" : "Recomendados"}
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app/guardados">
                {collapsed ? "🔖" : "Guardados"}
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app/empresa">
                {collapsed ? "🏢" : "Mi empresa"}
              </a>
              <a className="block rounded-xl px-3 py-2 hover:bg-white/10" href="/app/equipo">
                {collapsed ? "👥" : "Equipo"}
              </a>
            </nav>
          </aside>

          {/* Main */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-6 min-h-[calc(100vh-48px)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-white/60">Connex</div>
                <div className="text-xl font-semibold">Panel</div>
              </div>

              {loading ? (
                <div className="text-sm text-white/60">Cargando empresa…</div>
              ) : orgs.length ? (
                <OrgSelector orgs={orgs} />
              ) : (
                <div className="text-sm text-red-300">Sin organizaciones</div>
              )}
            </div>

            {children}
          </section>
        </div>
      </div>
    </OrgProvider>
  );
}
