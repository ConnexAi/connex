export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export async function apiFetch(path: string, opts: RequestInit & { token?: string } = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `API error ${res.status}`);
  }
  return data;
}
