"use client";

import { useEffect } from "react";
import { useOrg } from "../org-context";

type OrgItem = { orgId: string; role: string; name?: string };

export default function OrgSelector({ orgs }: { orgs: OrgItem[] }) {
  const { activeOrgId, setActiveOrgId } = useOrg();

  useEffect(() => {
    if (!orgs?.length) return;
    // si no hay activa, usa la primera
    if (!activeOrgId) setActiveOrgId(orgs[0].orgId);
  }, [orgs?.length, activeOrgId, setActiveOrgId]);

  // Si solo hay una org, no mostramos dropdown
  if (orgs.length === 1) {
    const o = orgs[0];
    return (
      <div className="text-sm text-white/70">
        Empresa: <span className="text-white/90 font-medium">{o.name ?? o.orgId.slice(0, 8)} · {o.role}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/60">Empresa</span>

      <select
        value={activeOrgId ?? orgs[0].orgId}
        onChange={(e) => setActiveOrgId(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white"
      >
        {orgs.map((o) => (
          <option key={o.orgId} value={o.orgId} className="bg-[#0b1c2d] text-white">
            {o.name ?? o.orgId.slice(0, 8)} · {o.role}
          </option>
        ))}
      </select>
    </div>
  );
}
