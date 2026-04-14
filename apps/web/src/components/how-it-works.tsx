import { GroupIcon, PredictionIcon, TrophyIcon } from "@/components/icons";
import { NetPattern } from "@/components/net-pattern";

const STEPS = [
  {
    icon: GroupIcon,
    title: "Creá tu grupo",
    description: "Invitá a tus amigos con un código, elegí el torneo y armá tu liga privada en segundos.",
  },
  {
    icon: PredictionIcon,
    title: "Predecí los scores",
    description: "Cargá tu pronóstico para cada partido. Se bloquea 5 minutos antes del inicio — y ahí se revelan los pronósticos de todos.",
  },
  {
    icon: TrophyIcon,
    title: "Subí al podio",
    description: "Exacto = 5pts, diferencia = 3pts, ganador = 1pt. En eliminatorias los puntos se multiplican x2 y x3. ¿Quién llega primero al podio?",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Subtle net pattern accent */}
      <NetPattern
        variant="green-only"
        fade="radial"
        opacity={0.5}
        density="sparse"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            ASÍ DE FÁCIL
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Tres pasos y ya estás compitiendo con tus amigos.
          </p>
        </div>

        {/* Steps — connected timeline layout */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute left-0 right-0 top-[calc(50%+2rem)] hidden h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent sm:block" />

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group relative flex flex-col items-center text-center"
              >
                {/* Card */}
                <div className="relative flex w-full flex-col items-center rounded-2xl border border-border/60 bg-surface/80 p-8 pt-12 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  {/* Step indicator — large faded number behind */}
                  <span className="pointer-events-none absolute right-4 top-3 font-display text-[80px] font-bold leading-none text-primary/[0.06] select-none">
                    {index + 1}
                  </span>

                  {/* Icon circle */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-text-on-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                    <Icon size={26} className="shrink-0" />
                  </div>

                  {/* Step number badge */}
                  <span className="mt-4 mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-xs font-bold text-accent-gold-dark">
                    {index + 1}
                  </span>

                  {/* Content */}
                  <h3 className="mt-2 font-display text-lg font-bold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
