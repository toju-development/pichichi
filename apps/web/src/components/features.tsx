import { PointsIcon, BonusIcon, LiveIcon, GlobeIcon, RevealIcon, DashboardIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: PointsIcon,
    title: "Sistema de puntos justo",
    description:
      "Resultado exacto = 5pts. Misma diferencia de goles = 3pts. Acertás el ganador = 1pt. En eliminatorias se multiplica: x2 en octavos, x3 en semis y final.",
    accent: "from-primary to-primary-light",
  },
  {
    icon: RevealIcon,
    title: "Social reveal",
    description:
      "Los pronósticos se mantienen secretos hasta 5 minutos antes de cada partido. Ahí se revelan todos — y empieza la tensión.",
    accent: "from-accent-gold-dark to-accent-gold",
  },
  {
    icon: BonusIcon,
    title: "Predicciones bonus",
    description:
      "Elegí al campeón, goleador, MVP y selección revelación antes de que arranque el torneo. 10 puntos extra por cada acierto.",
    accent: "from-accent-gold to-accent-gold-dark",
  },
  {
    icon: LiveIcon,
    title: "Todo en tiempo real",
    description:
      "Scores en vivo, puntos que se actualizan al instante y notificaciones para que no te pierdas ningún partido.",
    accent: "from-primary to-primary-light",
  },
  {
    icon: DashboardIcon,
    title: "Tu dashboard, tus stats",
    description:
      "Partidos del día, porcentaje de precisión, rachas activas y tu posición en cada grupo. Todo de un vistazo.",
    accent: "from-primary-light to-primary",
  },
  {
    icon: GlobeIcon,
    title: "Preparado para más",
    description:
      "Diseñado para el Mundial 2026, pero también para Copa América, Champions, Libertadores y más torneos.",
    accent: "from-primary-light to-primary",
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
