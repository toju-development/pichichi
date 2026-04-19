import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NetPattern } from "@/components/net-pattern";

export const metadata: Metadata = {
  title: "Política de privacidad — Pichichi",
  description:
    "Conocé cómo Pichichi recopila, usa y protege tus datos personales. Tu privacidad es importante para nosotros.",
  alternates: {
    canonical: "https://pichichi.app/privacy-policy",
  },
  openGraph: {
    title: "Política de privacidad — Pichichi",
    description:
      "Conocé cómo Pichichi recopila, usa y protege tus datos personales.",
    type: "website",
    url: "https://pichichi.app/privacy-policy",
    locale: "es_AR",
    siteName: "Pichichi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pichichi — Política de privacidad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Política de privacidad — Pichichi",
    description:
      "Conocé cómo Pichichi recopila, usa y protege tus datos personales.",
    images: ["/og-image.png"],
    site: "@pichichi_app",
  },
};

// ─── Privacy Policy Sections ──────────────────────────────────────────────────

const PRIVACY_SECTIONS = [
  {
    id: "que-datos-recopilamos",
    emoji: "📋",
    title: "Qué datos recopilamos",
    content: [
      {
        heading: "Datos que recopilamos",
        text: "Cuando iniciás sesión en Pichichi con Google, recibimos tu nombre y dirección de email desde tu cuenta de Google. Esos son los únicos datos personales que almacenamos.",
      },
      {
        heading: "Datos que NO recopilamos",
        text: "No recopilamos tu ubicación, no usamos herramientas de analítica de terceros, no instalamos cookies de seguimiento ni rastreadores publicitarios. Si no iniciaste sesión, no guardamos absolutamente nada sobre vos.",
      },
    ],
  },
  {
    id: "como-los-usamos",
    emoji: "🎯",
    title: "Cómo usamos tus datos",
    content: [
      {
        heading: "Autenticación",
        text: "Tu email y nombre se usan para crear y mantener tu cuenta en Pichichi. Sin esto, no podríamos identificarte ni guardar tus pronósticos.",
      },
      {
        heading: "Perfil en grupos",
        text: "Tu nombre se muestra a los otros miembros de los grupos en los que participás. Es la única forma en que otros usuarios ven tu información.",
      },
      {
        heading: "Lo que nunca hacemos",
        text: "No vendemos, alquilamos ni compartimos tus datos con terceros con fines comerciales. Tus datos existen para que puedas usar Pichichi, y nada más.",
      },
    ],
  },
  {
    id: "terceros",
    emoji: "🔗",
    title: "Terceros",
    content: [
      {
        heading: "Google Sign-In",
        text: "Pichichi usa Google OAuth para que puedas iniciar sesión sin contraseñas. Cuando usás \"Continuar con Google\", el proceso de autenticación lo maneja Google. La política de privacidad de Google aplica para esa parte del proceso. Podés consultarla en policies.google.com/privacy.",
      },
      {
        heading: "Infraestructura",
        text: "Tus datos se almacenan en una base de datos PostgreSQL alojada en Railway, una plataforma de cloud computing segura. Railway no tiene acceso ni usa tus datos más allá de almacenarlos de forma segura.",
      },
    ],
  },
  {
    id: "seguridad",
    emoji: "🔒",
    title: "Seguridad",
    content: [
      {
        heading: "Cómo protegemos tus datos",
        text: "No almacenamos contraseñas — la autenticación la delega completamente a Google, que usa los estándares de seguridad más altos del mercado. Tu información se transmite siempre usando HTTPS (conexión cifrada) y se almacena en servidores seguros.",
      },
      {
        heading: "Acceso a los datos",
        text: "Solo el equipo de desarrollo de Pichichi tiene acceso a la base de datos, y únicamente para operar y mantener el servicio. No se accede a datos de usuarios para fines distintos al funcionamiento de la app.",
      },
    ],
  },
  {
    id: "tus-derechos",
    emoji: "✅",
    title: "Tus derechos",
    content: [
      {
        heading: "Acceso y corrección",
        text: "Podés pedirte una copia de los datos que tenemos sobre vos o solicitar que los corrijamos si son incorrectos.",
      },
      {
        heading: "Eliminación de tu cuenta",
        text: "Si querés que eliminemos tu cuenta y todos los datos asociados, escribinos a pablomartinez555@gmail.com con el asunto \"Eliminar cuenta\". Procesamos el pedido dentro de los 7 días hábiles.",
      },
      {
        heading: "Portabilidad",
        text: "Tenés derecho a recibir los datos que nos diste en un formato legible. Escribinos al email de contacto y te lo enviamos.",
      },
    ],
  },
  {
    id: "contacto",
    emoji: "📬",
    title: "Contacto",
    content: [
      {
        heading: "¿Tenés preguntas?",
        text: "Si tenés dudas sobre esta política de privacidad o sobre cómo manejamos tus datos, escribinos a pablomartinez555@gmail.com. Respondemos todos los mensajes.",
      },
      {
        heading: "Cambios a esta política",
        text: "Si actualizamos esta política de privacidad, lo vamos a comunicar dentro de la app. La fecha de la última actualización siempre está visible al pie de esta página.",
      },
    ],
  },
] as const;

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PrivacyPolicyPage() {
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
              Política de{" "}
              <span className="text-gradient-primary">privacidad</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-text-secondary sm:text-xl">
              Transparencia total sobre qué datos recopilamos, cómo los usamos y
              cómo los protegemos.
            </p>
            <p className="mt-3 text-sm text-text-secondary/60">
              Última actualización: abril de 2026
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">
            {PRIVACY_SECTIONS.map((section) => (
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
