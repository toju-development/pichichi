const FEATURES = [
  {
    icon: "🎯",
    title: "Puntos por acierto",
    description:
      "Resultado exacto (5pts), diferencia de goles (3pts), ganador (1pt). Multiplicadores en eliminatorias.",
  },
  {
    icon: "🔮",
    title: "Predicciones bonus",
    description:
      "Predecí al campeón, goleador, MVP y revelación del torneo por 10 puntos extra cada una.",
  },
  {
    icon: "⚡",
    title: "Tiempo real",
    description:
      "Scores en vivo y ranking actualizado al instante. Nunca te perdés nada.",
  },
  {
    icon: "🌍",
    title: "Múltiples torneos",
    description:
      "No solo el Mundial: preparado para Copa América, Champions League y más.",
  },
  {
    icon: "👀",
    title: "Social reveal",
    description:
      "Las predicciones de tus amigos se revelan al pitazo inicial. La tensión es parte del juego.",
  },
] as const;

export function Features() {
  return (
    <section id="caracteristicas" className="bg-surface px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Todo lo que necesitás</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Características
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Pensado para que la experiencia sea divertida, justa y competitiva.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col rounded-2xl border border-border bg-bg p-6 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="mt-4 text-base font-semibold text-text-primary">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
