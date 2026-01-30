"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export function useBackend() {
  const [token, setToken] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1) pedir token backend (desde Next)
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");

        setToken(tData.accessToken);

        // 2) pedir /me (orgs)
        const me = await apiFetch("/me", { method: "GET", token: tData.accessToken });

        // Escoge la primera org (ideal: luego selector)
        const first = me?.orgs?.[0]?.orgId ?? null;
        setOrgId(first);
      } catch (e) {
        setToken(null);
        setOrgId(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { token, orgId, loading };
}
