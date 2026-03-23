import { NetPattern } from "@/components/net-pattern";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      {/* Net pattern background decoration */}
      <NetPattern
        variant="green-to-gold"
        fade="radial"
        opacity={0.6}
        density="normal"
      />

      {/* Ambient light blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent-gold/8 blur-[100px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        {/* Copy */}
        <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-surface/60 px-4 py-2 text-xs font-semibold tracking-wide text-primary backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-accent-gold animate-pulse" />
            MUNDIAL 2026
          </span>

          <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
            Demostrá quién
            <span className="text-gradient-primary"> sabe más </span>
            de fútbol
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary sm:text-xl">
            Creá tu grupo, predecí los resultados del Mundial 2026 y competí
            contra tus amigos. La gloria no espera.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#descargar"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-8 py-4 text-base font-semibold text-text-on-primary shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110"
            >
              Descargar la app
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface/60 px-6 py-4 text-base font-semibold text-primary backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary-surface/40"
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
          {/* Glow behind phone */}
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[4rem] bg-gradient-to-br from-primary/15 to-accent-gold/10 blur-3xl" />

          <div className="relative mx-auto h-[540px] w-[270px] overflow-hidden rounded-[2.5rem] border-2 border-text-primary/8 bg-text-primary shadow-2xl shadow-primary/20">
            {/* Notch */}
            <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-text-primary" />

            {/* Status bar */}
            <div className="flex items-center justify-between bg-primary-dark px-5 pt-8 pb-2">
              <span className="text-[10px] font-medium text-text-on-primary/70">9:41</span>
              <div className="flex gap-1">
                <div className="h-1.5 w-4 rounded-full bg-text-on-primary/60" />
                <div className="h-1.5 w-1.5 rounded-full bg-text-on-primary/60" />
                <div className="h-1.5 w-3 rounded-full bg-text-on-primary/40" />
              </div>
            </div>

            {/* App header */}
            <div className="bg-gradient-to-b from-primary-dark to-primary px-5 pb-5 pt-2">
              <p className="font-display text-sm font-bold text-text-on-primary tracking-wide">PICHICHI</p>
              <p className="mt-1 text-xs text-text-on-primary/60">Grupo A · Jornada 1</p>
            </div>

            {/* Match cards inside phone */}
            <div className="space-y-2.5 bg-bg p-3">
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

            {/* Bottom bar indicator */}
            <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-text-primary/20" />
          </div>
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-1.5 min-w-0">
          <span className="text-lg shrink-0">{flag1}</span>
          <span className="text-xs font-medium text-text-primary truncate">{team1}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-primary-dark/10 px-3 py-1 shrink-0 mx-1.5">
          <span className="text-sm font-bold text-primary">{score1}</span>
          <span className="text-[10px] text-text-tertiary">-</span>
          <span className="text-sm font-bold text-primary">{score2}</span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1.5 min-w-0">
          <span className="text-xs font-medium text-text-primary truncate">{team2}</span>
          <span className="text-lg shrink-0">{flag2}</span>
        </div>
      </div>
    </div>
  );
}
