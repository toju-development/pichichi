const STEPS = [
  {
    icon: "👥",
    title: "Creá tu grupo",
    description: "Invitá a tus amigos con un código de 8 caracteres.",
  },
  {
    icon: "⚽",
    title: "Predecí resultados",
    description: "Cargá el score de cada partido antes del pitazo inicial.",
  },
  {
    icon: "🏆",
    title: "Competí en el ranking",
    description: "Sumá puntos y demostrá que sos el que más sabe.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Así de fácil</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Tres pasos y ya estás compitiendo con tus amigos.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-text-on-primary">
                {index + 1}
              </div>
              {/* Icon */}
              <span className="text-4xl">{step.icon}</span>
              {/* Content */}
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
