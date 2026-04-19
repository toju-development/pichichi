import { PaletteIcon, UsersIcon, CalendarIcon, BonusIcon } from "@/components/icons";

const PRO_FEATURES = [
  {
    icon: PaletteIcon,
    title: "Tu marca, tu grupo",
    description: "Personalizá tu grupo con el logo y los colores de tu empresa, comunidad o equipo.",
    accent: "from-accent-gold to-accent-gold-dark",
  },
  {
    icon: UsersIcon,
    title: "Sin límite de participantes",
    description: "Sumá a todo tu equipo. 50, 100 o más personas compitiendo en el mismo grupo.",
    accent: "from-accent-gold-dark to-accent-gold",
  },
  {
    icon: CalendarIcon,
    title: "Múltiples torneos",
    description: "Jugá Champions, Libertadores y Mundial en el mismo grupo. Sin restricciones.",
    accent: "from-accent-gold to-accent-gold-dark",
  },
  {
    icon: BonusIcon,
    title: "Funciones exclusivas",
    description: "Social Reveal, detalle de pronósticos de cada miembro y más herramientas para tu grupo.",
    accent: "from-accent-gold-dark to-accent-gold",
  },
] as const;

export function PichichiPro() {
  return (
    <section id="premium" className="relative bg-primary-dark px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Ambient decorative blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent-gold/10 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-gold/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-accent-gold/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent-gold">
            PICHICHI PRO
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-on-primary sm:text-4xl lg:text-5xl">
            Llevá tu prode al{" "}
            <span className="text-accent-gold">siguiente nivel</span>
          </h2>
          <p className="mt-4 text-lg text-text-on-primary/70">
            Para grupos grandes, empresas y organizadores que quieren una experiencia premium.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRO_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-accent-gold/30 hover:bg-white/10 hover:shadow-lg hover:shadow-accent-gold/5"
              >
                {/* Icon + Title row */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-primary-dark shadow-md transition-transform group-hover:scale-110`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-base font-bold text-text-on-primary">
                    {feature.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-on-primary/70">
                  {feature.description}
                </p>

                {/* Subtle bottom accent line */}
                <div className="mt-auto pt-5">
                  <div className={`h-0.5 w-8 rounded-full bg-gradient-to-r ${feature.accent} opacity-40 transition-all group-hover:w-12 group-hover:opacity-70`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="mailto:pablomartinez555@gmail.com"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-accent-gold to-accent-gold-dark px-8 py-4 text-sm font-semibold text-primary-dark shadow-lg shadow-accent-gold/20 transition-all hover:brightness-110 hover:shadow-xl"
          >
            Contactanos
          </a>
        </div>
      </div>
    </section>
  );
}
