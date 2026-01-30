"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function AcceptInvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);

  const [backendToken, setBackendToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  // 1) si no hay token en URL, error
  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Falta el token en el link. Pide al OWNER que te reenvíe la invitación.");
    }
  }, [token]);

  // 2) si está logueado, obtener backend token
  useEffect(() => {
    if (!token) return;
    if (status !== "authenticated") return;

    (async () => {
      try {
        const tRes = await fetch("/api/backend/token", { cache: "no-store" });
        const tData = await tRes.json();
        if (!tRes.ok) throw new Error(tData?.message || "No backend token");
        setBackendToken(tData.accessToken);
      } catch (e: any) {
        setState("error");
        setMessage(e.message);
      }
    })();
  }, [status, token]);

  // 3) aceptar invitación
  useEffect(() => {
    if (!token) return;
    if (!backendToken) return;

    (async () => {
      setState("loading");
      setMessage("Aceptando invitación...");

      try {
        const res = await fetch(`${API_BASE}/invites/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${backendToken}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No se pudo aceptar la invitación.");

        setState("ok");
        setMessage("✅ Invitación aceptada. Redirigiendo...");

        setTimeout(() => router.push("/app"), 900);
      } catch (e: any) {
        setState("error");
        setMessage(e.message);
      }
    })();
  }, [backendToken, token, router]);

  return (
    <div className="min-h-screen bg-[#0b1c2d] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="text-sm text-white/60">Connex</div>
        <div className="text-2xl font-semibold mt-1">Aceptar invitación</div>

        <div className="mt-4 text-sm text-white/70">
          {message || "Verificando invitación..."}
        </div>

        {status !== "authenticated" && token && (
          <div className="mt-6">
            <button
              onClick={() => signIn("google", { callbackUrl: `/accept?token=${encodeURIComponent(token)}` })}
              className="rounded-2xl px-4 py-3 text-sm bg-white/10 hover:bg-white/15"
            >
              Iniciar sesión con Google
            </button>

            <div className="mt-3 text-xs text-white/50">
              Inicia sesión para asociar esta invitación a tu cuenta.
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="mt-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
            {message}
          </div>
        )}

        {state === "ok" && (
          <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-white/40 break-all">
          Token: {token || "—"}
        </div>
      </div>
    </div>
  );
}
