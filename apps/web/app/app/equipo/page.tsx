"use client";

import { useEffect, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function EquipoPage() {
  const { activeOrgId } = useOrg();

  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Invitar
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "OWNER">("MEMBER");
  const [daysValid, setDaysValid] = useState<number>(7);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  // Miembros
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

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

  async function loadMembers() {
    if (!token || !activeOrgId) return;
    setLoadingMembers(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No members");
      setMembers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e.message);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrgId]);

  async function createInvite() {
    if (!token || !activeOrgId || !inviteEmail.trim()) return;
    setCreatingInvite(true);
    setErr(null);
    setInviteResult(null);

    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,     // si tu backend aún no usa role, igual no rompe
          daysValid: daysValid, // si tu backend aún no usa daysValid, igual no rompe
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invite failed");

      setInviteResult(data);
      setInviteEmail("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreatingInvite(false);
    }
  }

  async function removeMember(userId: string) {
    if (!token || !activeOrgId) return;
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Remove failed");
      await loadMembers();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;
  if (!token) return <div className="text-white/70">Inicia sesión.</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-white/60">Equipo</div>
        <h1 className="text-2xl font-semibold">Miembros e invitaciones</h1>
        <p className="mt-1 text-sm text-white/60">
          Invita por correo. El invitado aceptará desde Connex en{" "}
          <span className="text-white/80">/accept</span>.
        </p>
      </div>

      {err && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* INVITAR */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="font-semibold mb-4">Invitar miembro</div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_140px_160px] gap-3 items-end">
          <div>
            <div className="text-xs text-white/60 mb-1">Email</div>
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
              placeholder="correo@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs text-white/60 mb-1">Rol</div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            >
              <option value="MEMBER" className="bg-[#0b1c2d] text-white">MEMBER</option>
              <option value="OWNER" className="bg-[#0b1c2d] text-white">OWNER</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-white/60 mb-1">Días</div>
            <input
              type="number"
              min={1}
              max={30}
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            onClick={createInvite}
            disabled={creatingInvite || !inviteEmail.trim()}
            className="rounded-xl px-4 py-2 text-sm bg-[#337ca0] hover:bg-[#337ca0]/90 disabled:opacity-50"
          >
            {creatingInvite ? "Creando..." : "Enviar invitación"}
          </button>
        </div>

        {inviteResult && (
          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="text-sm font-semibold">Invitación creada ✅</div>

            <div className="text-xs text-white/60 break-all">
              <b>Token:</b> <span className="text-white">{inviteResult.token ?? inviteResult.id}</span>
            </div>

            {inviteResult.link && (
              <div className="text-xs text-white/60 break-all">
                <b>Link:</b>{" "}
                <a className="text-white underline" href={inviteResult.link} target="_blank" rel="noreferrer">
                  {inviteResult.link}
                </a>
              </div>
            )}

            <div className="text-xs text-white/40">
              Si el correo está configurado, el invitado lo recibirá automáticamente.
            </div>
          </div>
        )}
      </div>

      {/* MIEMBROS */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="font-semibold">Miembros</div>
          <button
            onClick={loadMembers}
            className="rounded-xl px-3 py-2 text-sm bg-white/10 hover:bg-white/15"
          >
            Recargar
          </button>
        </div>

        {loadingMembers ? (
          <div className="text-sm text-white/60">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-white/60">No hay miembros.</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {m.user?.name ?? m.user?.email ?? m.userId}
                  </div>
                  <div className="text-xs text-white/60 truncate">{m.user?.email ?? m.userId}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs rounded-lg px-2 py-1 bg-white/10">{m.role}</span>

                  <button
                    onClick={() => removeMember(m.userId)}
                    className="text-xs rounded-lg px-2 py-1 bg-[#6a0000] hover:bg-[#6a0000]/90"
                    title="Eliminar del equipo"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
