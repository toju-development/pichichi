import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NetPattern } from "@/components/net-pattern";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Pichichi",
  description:
    "Términos y condiciones de uso de Pichichi, la app de pronósticos deportivos entre amigos.",
  alternates: {
    canonical: "https://pichichi.app/terms",
  },
  openGraph: {
    title: "Términos y Condiciones — Pichichi",
    description:
      "Términos y condiciones de uso de Pichichi, la app de pronósticos deportivos entre amigos.",
    type: "website",
    url: "https://pichichi.app/terms",
    locale: "es_AR",
    siteName: "Pichichi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pichichi — Términos y Condiciones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Términos y Condiciones — Pichichi",
    description:
      "Términos y condiciones de uso de Pichichi, la app de pronósticos deportivos entre amigos.",
    images: ["/og-image.png"],
    site: "@pichichi_app",
  },
};

// ─── Terms Sections ───────────────────────────────────────────────────────────

const TERMS_SECTIONS = [
  {
    id: "aceptacion",
    emoji: "📜",
    title: "Aceptación de los términos",
    content: [
      {
        heading: "Al usar Pichichi, aceptás estos términos",
        text: "Al acceder o usar Pichichi, estás aceptando estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte, por favor no uses la aplicación. El uso continuado de Pichichi después de cualquier cambio en estos términos implica tu aceptación de los mismos.",
      },
    ],
  },
  {
    id: "descripcion-servicio",
    emoji: "⚽",
    title: "Descripción del servicio",
    content: [
      {
        heading: "¿Qué es Pichichi?",
        text: "Pichichi es una aplicación de pronósticos deportivos entre amigos. Creás o te unís a grupos, hacés pronósticos sobre partidos de fútbol y competís con tus amigos para ver quién la pega más.",
      },
      {
        heading: "NO es una casa de apuestas",
        text: "Pichichi NO involucra dinero real, apuestas reales ni ningún tipo de transacción monetaria. Es un juego de entretenimiento entre amigos, pura diversión y cargadas. Si alguien te ofrece apostar plata a través de Pichichi, eso no tiene nada que ver con nosotros.",
      },
    ],
  },
  {
    id: "registro-cuentas",
    emoji: "🔑",
    title: "Registro y cuentas",
    content: [
      {
        heading: "Inicio de sesión con Google",
        text: "Para usar Pichichi necesitás iniciar sesión con tu cuenta de Google a través de Google OAuth. No manejamos contraseñas propias — tu autenticación la gestiona directamente Google.",
      },
      {
        heading: "Tu responsabilidad",
        text: "Sos responsable de toda la actividad que ocurra bajo tu cuenta. Si sospechás que alguien accedió a tu cuenta sin tu permiso, avisanos inmediatamente a pablomartinez555@gmail.com.",
      },
    ],
  },
  {
    id: "reglas-de-uso",
    emoji: "📏",
    title: "Reglas de uso",
    content: [
      {
        heading: "Comportamiento esperado",
        text: "Esperamos que uses Pichichi de buena fe: participá, hacé tus pronósticos, divertite con tus amigos. Simple y directo.",
      },
      {
        heading: "Lo que NO podés hacer",
        text: "No podés usar bots, scripts o herramientas automatizadas para interactuar con Pichichi. No podés hacer spam, abusar del sistema, intentar manipular resultados ni acosar a otros usuarios. Nos reservamos el derecho de suspender o eliminar cuentas que violen estas reglas.",
      },
    ],
  },
  {
    id: "propiedad-intelectual",
    emoji: "©️",
    title: "Propiedad intelectual",
    content: [
      {
        heading: "Nuestra propiedad",
        text: "El nombre Pichichi, el logo, el diseño de la app, el código y todo el contenido original son propiedad del equipo de Pichichi. No podés copiar, modificar, distribuir ni usar nuestra marca o contenido sin autorización expresa.",
      },
      {
        heading: "Tu contenido",
        text: "Los pronósticos y la actividad que generás dentro de Pichichi son tuyos. Sin embargo, al usar la app nos otorgás una licencia limitada para mostrar esa información a los otros miembros de tus grupos, que es básicamente el punto de la app.",
      },
    ],
  },
  {
    id: "limitacion-responsabilidad",
    emoji: "⚠️",
    title: "Limitación de responsabilidad",
    content: [
      {
        heading: "El servicio se ofrece 'tal cual'",
        text: "Pichichi se proporciona 'tal cual' y 'según disponibilidad'. No garantizamos que el servicio sea ininterrumpido, libre de errores o que esté disponible en todo momento. Hacemos nuestro mejor esfuerzo, pero somos un proyecto independiente.",
      },
      {
        heading: "Sin responsabilidad por daños",
        text: "En la máxima medida permitida por la ley, Pichichi no será responsable por daños directos, indirectos, incidentales o consecuentes que surjan del uso o la imposibilidad de uso de la aplicación.",
      },
    ],
  },
  {
    id: "modificaciones",
    emoji: "🔄",
    title: "Modificaciones a los términos",
    content: [
      {
        heading: "Podemos actualizar estos términos",
        text: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Si hacemos cambios importantes, te lo vamos a comunicar dentro de la app. La fecha de la última actualización siempre está visible al pie de esta página.",
      },
    ],
  },
  {
    id: "contacto",
    emoji: "📬",
    title: "Contacto",
    content: [
      {
        heading: "¿Tenés dudas?",
        text: "Si tenés preguntas sobre estos términos y condiciones, escribinos a pablomartinez555@gmail.com. Respondemos todos los mensajes.",
      },
    ],
  },
] as const;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TermsPage() {
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
              LEGAL
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Términos y{" "}
              <span className="text-gradient-primary">condiciones</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary sm:text-xl">
              Las reglas del juego. Qué podés esperar de Pichichi y qué
              esperamos de vos.
            </p>
            <p className="mt-3 text-sm text-text-secondary/60">
              Última actualización: abril de 2026
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">
            {TERMS_SECTIONS.map((section) => (
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

                {/* Content blocks */}
                <div className="space-y-4">
                  {section.content.map((block, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border/60 bg-surface/80 px-6 py-5 backdrop-blur-sm"
                    >
                      <h3 className="font-display text-sm font-semibold text-text-primary sm:text-base">
                        {block.heading}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
                        {block.text}
                      </p>
                    </div>
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
              ¿Tenés más preguntas?
              <span className="text-accent-gold"> Escribinos.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-text-on-primary/75 sm:text-lg">
              Si algo no quedó claro, mandanos un email a
              pablomartinez555@gmail.com y te respondemos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:pablomartinez555@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-dark shadow-xl shadow-primary-dark/30 transition-all hover:scale-105 hover:shadow-2xl"
              >
                Contactanos
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
    </>
  );
}
