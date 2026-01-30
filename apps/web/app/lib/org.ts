export const ORG_KEY = "connex_active_orgId";

export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_KEY);
}

export function setActiveOrgId(orgId: string) {
  localStorage.setItem(ORG_KEY, orgId);
}
