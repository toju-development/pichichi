import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NetPattern } from "@/components/net-pattern";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | Pichichi",
  description:
    "Todo lo que necesitás saber sobre Pichichi: cómo funcionan los grupos, el sistema de puntos, los pronósticos y más. Resolvé tus dudas acá.",
  alternates: {
    canonical: "https://pichichi.app/faq",
  },
  openGraph: {
    title: "Preguntas frecuentes | Pichichi",
    description:
      "Todo lo que necesitás saber sobre Pichichi: cómo funcionan los grupos, el sistema de puntos, los pronósticos y más.",
    type: "website",
    url: "https://pichichi.app/faq",
    locale: "es_AR",
    siteName: "Pichichi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pichichi — Preguntas frecuentes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preguntas frecuentes | Pichichi",
    description:
      "Todo lo que necesitás saber sobre Pichichi: grupos, puntos, pronósticos y más.",
    images: ["/og-image.png"],
    site: "@pichichi_app",
  },
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────

const FAQ_SECTIONS = [
  {
    id: "como-funciona",
    title: "¿Cómo funciona?",
    emoji: "⚽",
    items: [
      {
        question: "¿Qué es Pichichi?",
        answer:
          "Pichichi es una app de prode de fútbol para competir con tus amigos. Predecís el resultado exacto de cada partido del torneo — si acertás el score exacto sumás 5 puntos, si acertás la diferencia de goles 3 puntos, y si solo acertás el ganador 1 punto. Todo dentro de grupos privados que armás vos con quien quieras.",
      },
      {
        question: "¿Cómo empiezo a jugar?",
        answer:
          "Descargá la app para iOS o Android, iniciá sesión con tu cuenta de Google o Apple (gratis, sin tarjeta de crédito) y listo. Desde ahí podés crear un grupo nuevo o unirte a uno existente con un código de invitación. En minutos ya estás cargando pronósticos.",
      },
      {
        question: "¿Es gratis?",
        answer:
          "Sí, Pichichi es completamente gratis. Podés crear hasta 3 grupos, unirte a hasta 5 grupos de otros, tener hasta 10 miembros por grupo y participar en hasta 2 torneos por grupo — todo sin pagar nada ni dar datos de tarjeta.",
      },
    ],
  },
  {
    id: "grupos-y-amigos",
    title: "Grupos y amigos",
    emoji: "👥",
    items: [
      {
        question: "¿Cómo creo un grupo?",
        answer:
          'Desde la pantalla principal tocás "Crear grupo", le ponés un nombre y elegís el torneo. La app te genera automáticamente un código de invitación para compartir con tus amigos.',
      },
      {
        question: "¿Cómo invito amigos a mi grupo?",
        answer:
          "Cada grupo tiene un código de invitación único. Compartilo por WhatsApp, Instagram o donde quieras — tus amigos lo ingresan en la app y ya son parte del grupo. No necesitan tener cuenta previa para recibir el código.",
      },
      {
        question: "¿Cuántos grupos puedo tener?",
        answer:
          "Con el plan gratuito podés crear hasta 3 grupos propios y unirte como miembro a hasta 5 grupos creados por otros. O sea, podés estar activo en hasta 8 grupos en simultáneo.",
      },
      {
        question: "¿Cuántos miembros puede tener un grupo?",
        answer:
          "Cada grupo puede tener hasta 10 miembros en el plan gratuito. El ranking del grupo muestra la posición de cada uno en tiempo real.",
      },
    ],
  },
  {
    id: "pronosticos",
    title: "Pronósticos",
    emoji: "🔮",
    items: [
      {
        question: "¿Hasta cuándo puedo cargar mi pronóstico?",
        answer:
          "Podés cargar o cambiar tu pronóstico hasta el momento exacto del inicio del partido. El bloqueo es del lado del servidor — no hay forma de colar un pronóstico después del pitazo inicial.",
      },
      {
        question: "¿Puedo cambiar mi pronóstico?",
        answer:
          "Sí, podés cambiar tu pronóstico tantas veces como quieras hasta que el partido empiece. Una vez que el árbitro da inicio al juego, el pronóstico queda fijo.",
      },
      {
        question: "¿Puedo ver los pronósticos de mis amigos?",
        answer:
          'No hasta que el partido arranque. Pichichi usa "social reveal": los pronósticos de todos los miembros del grupo permanecen ocultos hasta el momento en que el partido comienza (LIVE). Esto evita copias y hace que la revelación sea un momento de tensión y diversión.',
      },
      {
        question: "¿Qué pasa si hay tiempo extra o penales?",
        answer:
          "El pronóstico se evalúa con el resultado al final del tiempo extra (90 minutos + tiempo adicional), NO con el resultado de los penales. Por ejemplo, si un partido termina 1-1 en 90 minutos, va a alargue y queda 2-2, y después se define por penales 4-3 — el score que cuenta para el prode es 2-2.",
      },
      {
        question: "¿Puedo tener pronósticos distintos para el mismo partido en grupos diferentes?",
        answer:
          "Sí, exactamente. Si estás en varios grupos, tu pronóstico para cada partido es independiente en cada uno. Podés poner Argentina 2-1 en un grupo y Argentina 1-0 en otro — los puntos se calculan por separado en cada grupo.",
      },
    ],
  },
  {
    id: "sistema-de-puntos",
    title: "Sistema de puntos",
    emoji: "🏆",
    items: [
      {
        question: "¿Cómo se calculan los puntos?",
        answer:
          "Hay tres niveles de acierto para cada partido: 1) Resultado exacto (por ejemplo, predecís 2-1 y sale 2-1): 5 puntos. 2) Misma diferencia de goles (predecís 3-1, sale 2-0 — ambos son +2): 3 puntos. 3) Acertás el ganador o empate (predecís 2-0, sale 1-0 — mismo ganador): 1 punto. Si errás todo: 0 puntos.",
      },
      {
        question: "¿Qué son los multiplicadores?",
        answer:
          "En las fases eliminatorias los puntos se multiplican para hacer las cosas más emocionantes: Fase de grupos: ×1 (máximo 5 puntos). Ronda de 32 / Octavos de final: ×2 (máximo 10 puntos). Cuartos / Semifinal / Tercer puesto / Final: ×3 (máximo 15 puntos). Un resultado exacto en la final vale 15 puntos.",
      },
      {
        question: "¿Qué son los pronósticos bonus?",
        answer:
          "Antes de que arranque el torneo podés cargar cuatro predicciones especiales: Campeón, Goleador (Top Scorer), MVP y Selección Revelación. Cada una vale 10 puntos si la acertás. Estos pronósticos se bloquean cuando arranca el primer partido del torneo y se resuelven al final del mismo.",
      },
      {
        question: "¿Cómo funciona el desempate en el ranking?",
        answer:
          "El puntaje total es la suma de los puntos de partidos más los puntos de los pronósticos bonus. Si dos personas empatan en puntos, el desempate se resuelve por cantidad de resultados exactos acertados (los de 5 puntos). Si siguen empatados, comparten la posición en el ranking.",
      },
    ],
  },
  {
    id: "cuenta-y-app",
    title: "Cuenta y app",
    emoji: "📱",
    items: [
      {
        question: "¿En qué dispositivos está disponible?",
        answer:
          "Pichichi está disponible para iOS (iPhone) y Android. La app está optimizada para móvil, que es donde más se usa — durante el partido, desde el sillón o la cancha.",
      },
      {
        question: "¿Necesito crear una cuenta?",
        answer:
          "Solo necesitás iniciar sesión con tu cuenta de Google o tu cuenta de Apple. No hay formularios largos, no hay contraseñas que recordar — un toque y adentro. Y es completamente gratis.",
      },
      {
        question: "¿Mis datos están seguros?",
        answer:
          "Sí. Pichichi usa Google Sign-In y Apple Sign-In, que son los sistemas de autenticación más seguros del mercado. No almacenamos contraseñas. Los datos de tu cuenta se usan exclusivamente para identificarte dentro de la app y mostrarte tu historial de pronósticos.",
      },
    ],
  },
] as const;

// ─── JSON-LD Structured Data ─────────────────────────────────────────────────

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }))
  ),
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <NetPattern
            variant="green-to-gold"
            fade="radial"
            opacity={0.4}
            density="sparse"
          />
          {/* Ambient blurs */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
            <div className="absolute -bottom-20 -left-40 h-[300px] w-[300px] rounded-full bg-accent-gold/8 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              AYUDA
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Preguntas{" "}
              <span className="text-gradient-primary">frecuentes</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary sm:text-xl">
              Todo lo que necesitás saber para armar tu prode, competir con tus
              amigos y entender cómo se suman los puntos.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.id} id={section.id}>
                {/* Section header */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-hidden="true">
                    {section.emoji}
                  </span>
                  <h2 className="font-display text-xl font-bold text-text-primary sm:text-2xl">
                    {section.title}
                  </h2>
                </div>

                {/* Accordion items */}
                <div className="space-y-3">
                  {section.items.map((item, index) => (
                    <details
                      key={index}
                      className="group rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-sm transition-all open:border-primary/30 open:shadow-md open:shadow-primary/5 hover:border-primary/20"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 select-none">
                        <span className="font-display text-sm font-semibold text-text-primary sm:text-base">
                          {item.question}
                        </span>
                        {/* Chevron icon */}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary transition-all group-open:rotate-180 group-open:bg-primary/15">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-6">
                        <div className="border-t border-border/40 pt-4">
                          <p className="text-sm leading-relaxed text-text-secondary sm:text-base">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <NetPattern
            variant="gold-only"
            fade="radial"
            opacity={0.5}
            density="sparse"
          />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent-gold/15 blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary-light/20 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-text-on-primary sm:text-3xl lg:text-4xl">
              ¿Listo para jugar?
              <span className="text-accent-gold"> Descargá la app.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-text-on-primary/75 sm:text-lg">
              Gratis para iOS y Android. Armá tu grupo y empezá a cargar
              pronósticos antes de que arranque el Mundial.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/#descargar"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-dark shadow-xl shadow-primary-dark/30 transition-all hover:scale-105 hover:shadow-2xl"
              >
                Descargar la app
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-semibold text-text-on-primary backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />
    </>
  );
}
