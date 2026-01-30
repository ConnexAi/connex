export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#0b1c2d]">
      {/* Top nav */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-2xl">connex</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#0b1c2d]/70">
          <a href="#como" className="hover:text-[#0b1c2d]">Cómo funciona</a>
          <a href="#beneficios" className="hover:text-[#0b1c2d]">Beneficios</a>
          <a href="#planes" className="hover:text-[#0b1c2d]">Planes</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/api/auth/signin"
            className="rounded-full px-4 py-2 text-sm border border-black/10 bg-white hover:bg-white/80"
          >
            Iniciar sesión
          </a>
          <a
            href="/api/auth/signin"
            className="rounded-full px-4 py-2 text-sm text-white bg-[#6a0000] hover:bg-[#6a0000]/90"
          >
            Probar Connex
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight">
              Licitaciones con IA,
              <span className="block text-[#337ca0]"> sin complicarte.</span>
            </h1>

            <p className="mt-5 text-base lg:text-lg text-[#0b1c2d]/70 leading-relaxed">
              Connex encuentra oportunidades del SECOP, las evalúa para tu empresa y te guía con checklist,
              documentos y borradores listos para aplicar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/api/auth/signin"
                className="rounded-full px-6 py-3 text-sm text-white bg-[#6a0000] hover:bg-[#6a0000]/90"
              >
                Empezar ahora
              </a>
              <a
                href="#como"
                className="rounded-full px-6 py-3 text-sm border border-black/10 bg-white hover:bg-white/80"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-8 text-xs text-[#0b1c2d]/60">
              * Connex AI no reemplaza asesoría jurídica. Te ayuda a entender, organizar y redactar borradores revisables.
            </div>
          </div>

          {/* Mock */}
          <div className="relative">
            <div className="rounded-3xl bg-white border border-black/10 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-black/10 flex items-center justify-between">
                <div className="text-sm font-medium">Connex</div>
                <div className="text-xs text-[#0b1c2d]/60">Demo UI</div>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-2xl bg-[#0b1c2d] text-white p-4">
                  <div className="text-sm font-semibold">Resumen IA</div>
                  <ul className="mt-2 text-sm text-white/80 list-disc pl-5 space-y-1">
                    <li>3 procesos con alta compatibilidad</li>
                    <li>1 requiere documentos adicionales</li>
                    <li>1 coincide con tu perfil al 92%</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-sm font-semibold">Suministro de laptops</div>
                    <div className="mt-1 text-xs text-[#0b1c2d]/60">Bogotá · Menor cuantía</div>
                    <div className="mt-3 inline-flex items-center rounded-full bg-[#337ca0]/10 text-[#337ca0] px-3 py-1 text-xs">
                      IA: recomendada
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-sm font-semibold">Servicios de consultoría</div>
                    <div className="mt-1 text-xs text-[#0b1c2d]/60">Cali · Mínima cuantía</div>
                    <div className="mt-3 inline-flex items-center rounded-full bg-[#337ca0]/10 text-[#337ca0] px-3 py-1 text-xs">
                      IA: con riesgos
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f5f5f5] border border-black/10 p-4 text-sm text-[#0b1c2d]/70">
                  “Te recomiendo revisar primero requisitos habilitantes y fechas. Siguiente paso: guarda el proceso y descarga pliego.”
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-[#337ca0]/15 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Beneficios</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { title: "Recomendaciones", desc: "Score por empresa y explicación clara del porqué sí o no." },
            { title: "Documentos y checklist", desc: "Organiza lo que debes presentar y qué revisar primero." },
            { title: "Ahorro de tiempo", desc: "Menos procesos irrelevantes, más oportunidades reales." },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl bg-white border border-black/10 p-6">
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="mt-2 text-sm text-[#0b1c2d]/70">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como" className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Cómo funciona</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { n: "01", title: "Configura tu empresa", desc: "Onboarding guiado + documentos esenciales." },
            { n: "02", title: "Connex recomienda", desc: "Procesos del SECOP evaluados por tu perfil." },
            { n: "03", title: "Aplicar con guía", desc: "Chat + checklist + borradores revisables." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl bg-white border border-black/10 p-6">
              <div className="text-xs text-[#0b1c2d]/50">{s.n}</div>
              <div className="mt-1 text-sm font-semibold">{s.title}</div>
              <div className="mt-2 text-sm text-[#0b1c2d]/70">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="planes" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold">Planes</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-white border border-black/10 p-6">
            <div className="text-sm font-semibold">Básico</div>
            <div className="mt-2 text-sm text-[#0b1c2d]/70">1 empresa · 3 miembros · Recomendaciones + Chat</div>
            <div className="mt-6">
              <a href="/api/auth/signin" className="rounded-full px-5 py-2 text-sm bg-[#6a0000] text-white">
                Probar
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0b1c2d] text-white border border-white/10 p-6">
            <div className="text-sm font-semibold">Pro</div>
            <div className="mt-2 text-sm text-white/80">Más alertas · Más análisis · Plantillas de postulación</div>
            <div className="mt-6">
              <a href="/api/auth/signin" className="rounded-full px-5 py-2 text-sm bg-white text-[#0b1c2d]">
                Hablar con Connex
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[#0b1c2d]/60">
          © {new Date().getFullYear()} Connex · Connex AI
        </div>
      </footer>
    </main>
  );
}
