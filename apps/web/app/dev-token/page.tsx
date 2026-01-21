"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function DevTokenPage() {
  const { data, status } = useSession();

  if (status === "loading") return <div style={{ padding: 24 }}>Loading...</div>;

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dev Token</h1>
        <button onClick={() => signIn("google")}>Sign in with Google</button>
      </div>
    );
  }

  const idToken = (data as any).idToken;

  return (
    <div style={{ padding: 24 }}>
      <h1>Dev Token</h1>
      <p>
        Signed in as: <b>{data.user?.email}</b>
      </p>

      <button onClick={() => signOut()}>Sign out</button>

      <h2>ID Token (Google)</h2>
      <textarea
        readOnly
        value={idToken ?? "NO ID TOKEN FOUND"}
        style={{ width: "100%", height: 220 }}
      />
      <p style={{ color: "#999" }}>
        Este token solo es para pruebas locales. No lo muestres en producción.
      </p>
    </div>
  );
}
