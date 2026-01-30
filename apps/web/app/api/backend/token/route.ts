import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  // Lee la sesión de NextAuth (ahí tienes idToken)
  const session = await getServerSession(authOptions);
  const idToken = (session as any)?.idToken;

  if (!idToken) {
    return NextResponse.json({ message: "Missing idToken in session" }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

  const res = await fetch(`${apiBase}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  // backend devuelve { accessToken, user }
  return NextResponse.json(data);
}
