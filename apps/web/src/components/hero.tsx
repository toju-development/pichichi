export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-surface opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-surface opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Copy */}
        <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-surface px-4 py-1.5 text-xs font-medium text-primary">
            🏆 Mundial 2026
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Demostrá quién sabe más de fútbol
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary sm:text-xl">
            Creá tu grupo, predecí los resultados del Mundial 2026 y competí
            contra tus amigos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#descargar"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-medium text-text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-light hover:shadow-xl hover:shadow-primary-light/25"
            >
              Descargar la app
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium text-primary transition-colors hover:bg-primary-surface"
            >
              Ver cómo funciona
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative flex-shrink-0">
          <div className="relative mx-auto h-[520px] w-[260px] overflow-hidden rounded-[2.5rem] border-4 border-text-primary/10 bg-surface shadow-2xl">
            {/* Status bar */}
            <div className="flex items-center justify-between bg-primary px-5 py-2">
              <span className="text-[10px] font-medium text-text-on-primary">9:41</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-text-on-primary/80" />
                <div className="h-2 w-2 rounded-full bg-text-on-primary/80" />
                <div className="h-2 w-2 rounded-full bg-text-on-primary/60" />
              </div>
            </div>
            {/* App header */}
            <div className="bg-primary px-5 pb-4 pt-2">
              <p className="text-sm font-semibold text-text-on-primary">⚽ Pichichi</p>
              <p className="mt-0.5 text-xs text-text-on-primary/70">Grupo A · Jornada 1</p>
            </div>
            {/* Match card inside phone */}
            <div className="space-y-3 p-4">
              <PhoneMockMatchCard
                date="11 Jun 2026"
                team1="México"
                flag1="🇲🇽"
                team2="Sudáfrica"
                flag2="🇿🇦"
                score1={2}
                score2={1}
              />
              <PhoneMockMatchCard
                date="11 Jun 2026"
                team1="Argentina"
                flag1="🇦🇷"
                team2="Arabia Saudita"
                flag2="🇸🇦"
                score1={3}
                score2={0}
              />
              <PhoneMockMatchCard
                date="12 Jun 2026"
                team1="España"
                flag1="🇪🇸"
                team2="Brasil"
                flag2="🇧🇷"
                score1={1}
                score2={1}
              />
            </div>
          </div>
          {/* Glow behind phone */}
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[3rem] bg-primary/10 blur-2xl" />
        </div>
      </div>
    </section>
  );
}

function PhoneMockMatchCard({
  date,
  team1,
  flag1,
  team2,
  flag2,
  score1,
  score2,
}: {
  date: string;
  team1: string;
  flag1: string;
  team2: string;
  flag2: string;
  score1: number;
  score2: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="mb-2 text-[10px] text-text-tertiary">{date} · Grupo A</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag1}</span>
          <span className="text-xs font-medium text-text-primary">{team1}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-primary-surface px-2 py-0.5">
          <span className="text-sm font-semibold text-primary">{score1}</span>
          <span className="text-[10px] text-text-tertiary">-</span>
          <span className="text-sm font-semibold text-primary">{score2}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary">{team2}</span>
          <span className="text-lg">{flag2}</span>
        </div>
      </div>
    </div>
  );
}
