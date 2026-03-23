import { NetPattern } from "@/components/net-pattern";

const MATCHES = [
  {
    date: "11 Jun 2026",
    group: "Grupo A",
    stadium: "Estadio Azteca",
    multiplier: "x1",
    team1: { name: "México", flag: "🇲🇽", code: "MEX" },
    team2: { name: "Sudáfrica", flag: "🇿🇦", code: "RSA" },
  },
  {
    date: "11 Jun 2026",
    group: "Grupo A",
    stadium: "MetLife Stadium",
    multiplier: "x1",
    team1: { name: "EE.UU.", flag: "🇺🇸", code: "USA" },
    team2: { name: "Canadá", flag: "🇨🇦", code: "CAN" },
  },
  {
    date: "12 Jun 2026",
    group: "Grupo B",
    stadium: "Hard Rock Stadium",
    multiplier: "x1",
    team1: { name: "Argentina", flag: "🇦🇷", code: "ARG" },
    team2: { name: "Australia", flag: "🇦🇺", code: "AUS" },
  },
  {
    date: "12 Jun 2026",
    group: "Grupo C",
    stadium: "AT&T Stadium",
    multiplier: "x1",
    team1: { name: "España", flag: "🇪🇸", code: "ESP" },
    team2: { name: "Brasil", flag: "🇧🇷", code: "BRA" },
  },
] as const;

export function MatchesPreview() {
  return (
    <section id="partidos" className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Stadium atmosphere background */}
      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/[0.03] via-transparent to-primary-dark/[0.05]" />
      </div>

      {/* Goal net pattern as field texture */}
      <NetPattern
        variant="green-to-gold"
        fade="radial"
        opacity={1}
        density="dense"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-4 py-1.5 text-xs font-bold tracking-widest text-accent-gold-dark">
            <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-accent-gold" />
            MIRÁ LO QUE VIENE
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Próximos partidos
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Así se ve la experiencia en la app. ¿Qué resultado pondrías?
          </p>
        </div>

        {/* Match cards — premium broadcast style */}
        <div className="mt-16 space-y-5">
          {MATCHES.map((match, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface/90 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              {/* Top gradient accent bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent-gold to-primary opacity-60 transition-opacity group-hover:opacity-100" />

              {/* Subtle net texture inside card */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <defs>
                    <pattern id={`card-net-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="20" y2="20" stroke="#0B6E4F" strokeWidth="0.8" />
                      <line x1="20" y1="0" x2="0" y2="20" stroke="#0B6E4F" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="120" height="120" fill={`url(#card-net-${index})`} />
                </svg>
              </div>

              <div className="relative flex flex-col items-center gap-4 px-5 pb-5 pt-6 sm:flex-row sm:gap-6 sm:px-8 sm:py-6">
                {/* Match meta — left column */}
                <div className="flex shrink-0 flex-col items-center gap-1 sm:w-32 sm:items-start">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary">
                    {match.group}
                  </span>
                  <span className="text-xs text-text-tertiary">{match.date}</span>
                  <span className="hidden text-[10px] text-text-tertiary/70 sm:block">{match.stadium}</span>
                </div>

                {/* Teams + VS — center showcase */}
                <div className="flex flex-1 items-center justify-center gap-3 sm:gap-5">
                  {/* Team 1 */}
                  <div className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:justify-end sm:gap-3">
                    <span className="text-4xl drop-shadow-sm sm:order-1 sm:text-5xl">{match.team1.flag}</span>
                    <div className="flex flex-col items-center sm:items-end sm:order-none">
                      <span className="text-sm font-bold text-text-primary sm:text-base">{match.team1.name}</span>
                      <span className="text-[10px] font-semibold tracking-wider text-text-tertiary">{match.team1.code}</span>
                    </div>
                  </div>

                  {/* VS badge — compact */}
                  <div className="relative flex shrink-0 flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-gold/30 bg-gradient-to-br from-primary-dark to-primary text-[9px] font-black text-accent-gold shadow-sm shadow-primary/10 transition-transform group-hover:scale-105 sm:h-8 sm:w-8 sm:text-[10px]">
                      VS
                    </div>
                    <span className="mt-1 rounded-full bg-accent-gold/20 px-2 py-px text-[8px] font-bold tracking-wider text-accent-gold-dark">
                      {match.multiplier}
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:justify-start sm:gap-3">
                    <span className="text-4xl drop-shadow-sm sm:text-5xl">{match.team2.flag}</span>
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-sm font-bold text-text-primary sm:text-base">{match.team2.name}</span>
                      <span className="text-[10px] font-semibold tracking-wider text-text-tertiary">{match.team2.code}</span>
                    </div>
                  </div>
                </div>

                {/* CTA — right column */}
                <div className="w-full sm:w-auto sm:shrink-0">
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-bold text-text-on-primary shadow-md shadow-primary/15 transition-all group-hover:shadow-lg group-hover:shadow-primary/25 group-hover:brightness-110 sm:w-auto"
                  >
                    Predecir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
