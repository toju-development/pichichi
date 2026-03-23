import { PointsIcon, BonusIcon, LiveIcon, GlobeIcon, RevealIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: PointsIcon,
    title: "Puntos por acierto",
    description:
      "Resultado exacto (5pts), diferencia de goles (3pts), ganador (1pt). Multiplicadores en eliminatorias.",
    accent: "from-primary to-primary-light",
  },
  {
    icon: BonusIcon,
    title: "Predicciones bonus",
    description:
      "Predecí al campeón, goleador, MVP y revelación del torneo por 10 puntos extra cada una.",
    accent: "from-accent-gold to-accent-gold-dark",
  },
  {
    icon: LiveIcon,
    title: "Tiempo real",
    description:
      "Scores en vivo y ranking actualizado al instante. Nunca te perdés nada.",
    accent: "from-primary to-primary-light",
  },
  {
    icon: GlobeIcon,
    title: "Múltiples torneos",
    description:
      "No solo el Mundial: preparado para Copa América, Champions League y más.",
    accent: "from-primary-light to-primary",
  },
  {
    icon: RevealIcon,
    title: "Social reveal",
    description:
      "Las predicciones de tus amigos se revelan al pitazo inicial. La tensión es parte del juego.",
    accent: "from-accent-gold-dark to-accent-gold",
  },
] as const;

export function Features() {
  return (
    <section id="caracteristicas" className="relative bg-surface px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            TODO LO QUE NECESITÁS
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Características
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Pensado para que la experiencia sea divertida, justa y competitiva.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative flex flex-col rounded-2xl border border-border/60 bg-bg/60 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-surface hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Icon + Title row (horizontal) */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-md transition-transform group-hover:scale-110`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-base font-bold text-text-primary">
                    {feature.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>

                {/* Subtle bottom accent line */}
                <div className={`mt-auto pt-5`}>
                  <div className={`h-0.5 w-8 rounded-full bg-gradient-to-r ${feature.accent} opacity-40 transition-all group-hover:w-12 group-hover:opacity-70`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
