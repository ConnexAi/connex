"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ORG_KEY = "connex_active_orgId";

type OrgCtx = {
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
};

const OrgContext = createContext<OrgCtx | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [activeOrgId, _setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(ORG_KEY);
    if (stored) _setActiveOrgId(stored);
  }, []);

  const setActiveOrgId = (id: string) => {
    localStorage.setItem(ORG_KEY, id);
    _setActiveOrgId(id);
  };

  return (
    <OrgContext.Provider value={{ activeOrgId, setActiveOrgId }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
