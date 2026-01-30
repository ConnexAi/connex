"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrg } from "../org-context";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

type Profile = {
  legalName?: string | null;
  tradeName?: string | null;
  activitySummary?: string | null;
  regions?: string[] | null;
  hasRUP?: boolean | null;
  rupCodes?: string[] | null;
};

type Doc = {
  id: string;
  type: string;
  fileName: string;
  url?: string | null;
  uploadedAt?: string;
};

type Experience = {
  id: string;
  description: string;
  contractingEntity?: string | null;
  amountCOP?: number | null;
};

export default function EmpresaPage() {
  const { activeOrgId } = useOrg();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // profile
  const [profile, setProfile] = useState<Profile>({
    legalName: "",
    tradeName: "",
    activitySummary: "",
    regions: [],
    hasRUP: false,
    rupCodes: [],
  });

  // docs
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState("RUT");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // experience
  const [expList, setExpList] = useState<Experience[]>([]);
  const [expDesc, setExpDesc] = useState("");
  const [expEntity, setExpEntity] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [deletingExpId, setDeletingExpId] = useState<string | null>(null);

  // financials
  const year = new Date().getFullYear();
  const [finRevenue, setFinRevenue] = useState("");
  const [finAssets, setFinAssets] = useState("");
  const [finLiab, setFinLiab] = useState("");
  const [finSaving, setFinSaving] = useState(false);

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

  async function loadAll() {
    if (!token || !activeOrgId) return;
    setLoading(true);
    setErr(null);

    try {
      // profile
      const pRes = await fetch(`${API_BASE}/orgs/${activeOrgId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pData = await pRes.json();
      if (pRes.ok && pData) {
        setProfile({
          legalName: pData.legalName ?? "",
          tradeName: pData.tradeName ?? "",
          activitySummary: pData.activitySummary ?? "",
          regions: Array.isArray(pData.regions) ? pData.regions : [],
          hasRUP: Boolean(pData.hasRUP),
          rupCodes: Array.isArray(pData.rupCodes) ? pData.rupCodes : [],
        });
      }

      // docs (listDocuments viene de ProfileController)
      const dRes = await fetch(`${API_BASE}/orgs/${activeOrgId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dData = await dRes.json();
      if (dRes.ok) setDocs(Array.isArray(dData) ? dData : []);

      // experience
      const eRes = await fetch(`${API_BASE}/orgs/${activeOrgId}/experience`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eData = await eRes.json();
      if (eRes.ok) setExpList(Array.isArray(eData) ? eData : []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeOrgId]);

  const regionsText = useMemo(() => (profile.regions ?? []).join(", "), [profile.regions]);
  const rupCodesText = useMemo(() => (profile.rupCodes ?? []).join(", "), [profile.rupCodes]);

  async function saveProfile() {
    if (!token || !activeOrgId) return;
    setSaving(true);
    setErr(null);

    try {
      const body: any = {
        legalName: profile.legalName || null,
        tradeName: profile.tradeName || null,
        activitySummary: profile.activitySummary || null,
        regions: (regionsText || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        hasRUP: Boolean(profile.hasRUP),
        rupCodes: (rupCodesText || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No save profile");

      await loadAll();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoc() {
    if (!token || !activeOrgId || !docFile) return;
    setUploading(true);
    setErr(null);

    try {
      const fd = new FormData();
      fd.append("type", docType);
      fd.append("file", docFile);

      // upload está en DocumentsController
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");

      setDocFile(null);
      await loadAll();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(docId: string) {
    if (!token || !activeOrgId) return;
    setDeletingDocId(docId);
    setErr(null);

    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete doc failed");
      await loadAll();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDeletingDocId(null);
    }
  }

  async function addExperience() {
    if (!token || !activeOrgId || !expDesc.trim()) return;
    setErr(null);

    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/experience`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: expDesc,
          contractingEntity: expEntity || null,
          amountCOP: expAmount ? Number(expAmount) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No add experience");

      setExpDesc("");
      setExpEntity("");
      setExpAmount("");
      await loadAll();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function deleteExperience(expId: string) {
    if (!token || !activeOrgId) return;
    setDeletingExpId(expId);
    setErr(null);

    try {
      // deleteExperience está en ProfileController
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/experience/${expId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Delete experience failed");
      await loadAll();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDeletingExpId(null);
    }
  }

  async function saveFinancials() {
    if (!token || !activeOrgId) return;
    setFinSaving(true);
    setErr(null);

    try {
      const res = await fetch(`${API_BASE}/orgs/${activeOrgId}/financials/${year}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          revenueCOP: finRevenue ? Number(finRevenue) : null,
          assetsCOP: finAssets ? Number(finAssets) : null,
          liabilitiesCOP: finLiab ? Number(finLiab) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No save financials");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setFinSaving(false);
    }
  }

  if (!activeOrgId) return <div className="text-white/70">Selecciona una empresa.</div>;
  if (!token) return <div className="text-white/70">Inicia sesión.</div>;
  if (loading) return <div className="text-white/70">Cargando empresa…</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-white/60">Mi empresa</div>
        <h1 className="text-2xl font-semibold">Perfil del proponente</h1>
        <p className="mt-1 text-sm text-white/60">Completa esto para que Connex AI recomiende mejor.</p>
      </div>

      {err && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* PERFIL */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="font-semibold mb-4">Datos básicos</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Razón social"
            value={profile.legalName ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, legalName: e.target.value }))}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Nombre comercial"
            value={profile.tradeName ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, tradeName: e.target.value }))}
          />
        </div>

        <textarea
          className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none min-h-[90px]"
          placeholder="¿Qué hace tu empresa? (resumen)"
          value={profile.activitySummary ?? ""}
          onChange={(e) => setProfile((p) => ({ ...p, activitySummary: e.target.value }))}
        />

        <input
          className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
          placeholder="Regiones (separadas por coma) ej: Valle del Cauca, Bogotá"
          value={regionsText}
          onChange={(e) =>
            setProfile((p) => ({
              ...p,
              regions: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
            }))
          }
        />

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-white/70 flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(profile.hasRUP)}
              onChange={(e) => setProfile((p) => ({ ...p, hasRUP: e.target.checked }))}
            />
            Tiene RUP
          </label>
        </div>

        <input
          className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
          placeholder="Códigos RUP/UNSPSC (separados por coma)"
          value={rupCodesText}
          onChange={(e) =>
            setProfile((p) => ({
              ...p,
              rupCodes: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
            }))
          }
        />

        <div className="mt-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </div>

      {/* DOCUMENTOS */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="font-semibold mb-4">Documentos</div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
          >
            <option value="RUT" className="bg-[#0b1c2d] text-white">RUT</option>
            <option value="CAMARA_COMERCIO" className="bg-[#0b1c2d] text-white">Cámara de comercio</option>
            <option value="RUP" className="bg-[#0b1c2d] text-white">RUP</option>
            <option value="OTHER" className="bg-[#0b1c2d] text-white">Otro</option>
          </select>

          <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />

          <button
            onClick={uploadDoc}
            disabled={uploading || !docFile}
            className="rounded-xl px-4 py-2 text-sm bg-[#337ca0] hover:bg-[#337ca0]/90 disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {docs.length === 0 ? (
            <div className="text-sm text-white/60">Aún no hay documentos.</div>
          ) : (
            docs.map((d) => (
              <div key={d.id} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium break-words">{d.fileName}</div>
                    <div className="text-xs text-white/50">{d.type}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {d.url ? (
                      <a
                        className="text-xs rounded-lg px-2 py-1 bg-white/10 hover:bg-white/15"
                        href={`${API_BASE}${d.url}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir
                      </a>
                    ) : null}

                    <button
                      onClick={() => deleteDoc(d.id)}
                      disabled={deletingDocId === d.id}
                      className="text-xs rounded-lg px-2 py-1 bg-[#6a0000] hover:bg-[#6a0000]/90 disabled:opacity-50"
                      title="Eliminar documento"
                    >
                      {deletingDocId === d.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EXPERIENCIA */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="font-semibold mb-4">Experiencia</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none md:col-span-2"
            placeholder="Descripción (obligatorio)"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Monto COP (opcional)"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none md:col-span-3"
            placeholder="Entidad contratante (opcional)"
            value={expEntity}
            onChange={(e) => setExpEntity(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <button
            onClick={addExperience}
            disabled={!expDesc.trim()}
            className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            Agregar experiencia
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {expList.length === 0 ? (
            <div className="text-sm text-white/60">Aún no hay experiencia registrada.</div>
          ) : (
            expList.map((e) => (
              <div key={e.id} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{e.description}</div>
                    <div className="text-xs text-white/50">
                      {e.contractingEntity ?? "Entidad no definida"} ·{" "}
                      {typeof e.amountCOP === "number"
                        ? `$${Math.round(e.amountCOP).toLocaleString("es-CO")} COP`
                        : "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteExperience(e.id)}
                    disabled={deletingExpId === e.id}
                    className="text-xs rounded-lg px-2 py-1 bg-[#6a0000] hover:bg-[#6a0000]/90 disabled:opacity-50"
                    title="Eliminar experiencia"
                  >
                    {deletingExpId === e.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FINANCIEROS */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="font-semibold mb-2">Financieros ({year})</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Ingresos COP"
            value={finRevenue}
            onChange={(e) => setFinRevenue(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Activos COP"
            value={finAssets}
            onChange={(e) => setFinAssets(e.target.value)}
          />
          <input
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Pasivos COP"
            value={finLiab}
            onChange={(e) => setFinLiab(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <button
            onClick={saveFinancials}
            disabled={finSaving}
            className="rounded-xl px-4 py-2 text-sm bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            {finSaving ? "Guardando..." : "Guardar financieros"}
          </button>
        </div>
      </div>
    </div>
  );
}
