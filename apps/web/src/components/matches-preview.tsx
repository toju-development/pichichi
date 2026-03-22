const MATCHES = [
  {
    date: "11 Jun 2026",
    group: "Grupo A",
    multiplier: "x1",
    team1: { name: "México", flag: "🇲🇽" },
    team2: { name: "Sudáfrica", flag: "🇿🇦" },
  },
  {
    date: "11 Jun 2026",
    group: "Grupo A",
    multiplier: "x1",
    team1: { name: "EE.UU.", flag: "🇺🇸" },
    team2: { name: "Canadá", flag: "🇨🇦" },
  },
  {
    date: "12 Jun 2026",
    group: "Grupo B",
    multiplier: "x1",
    team1: { name: "Argentina", flag: "🇦🇷" },
    team2: { name: "Australia", flag: "🇦🇺" },
  },
  {
    date: "12 Jun 2026",
    group: "Grupo C",
    multiplier: "x1",
    team1: { name: "España", flag: "🇪🇸" },
    team2: { name: "Brasil", flag: "🇧🇷" },
  },
] as const;

export function MatchesPreview() {
  return (
    <section id="partidos" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium text-primary">Mirá lo que viene</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Próximos partidos del Mundial 2026
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Así se ve la experiencia en la app. ¿Qué resultado pondrías?
          </p>
        </div>

        {/* Match cards */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MATCHES.map((match, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Match meta */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  {match.date} · {match.group}
                </span>
                <span className="rounded-full bg-primary-surface px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {match.multiplier}
                </span>
              </div>

              {/* Teams and scores */}
              <div className="mt-4 flex items-center justify-between gap-4">
                {/* Team 1 */}
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-3xl">{match.team1.flag}</span>
                  <span className="text-sm font-medium text-text-primary">{match.team1.name}</span>
                </div>

                {/* Score inputs (visual only) */}
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border bg-bg text-base font-semibold text-text-tertiary">
                    –
                  </div>
                  <span className="text-xs font-medium text-text-tertiary">vs</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border bg-bg text-base font-semibold text-text-tertiary">
                    –
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex flex-1 items-center justify-end gap-3">
                  <span className="text-sm font-medium text-text-primary">{match.team2.name}</span>
                  <span className="text-3xl">{match.team2.flag}</span>
                </div>
              </div>

              {/* Save button (visual only) */}
              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary"
              >
                Guardar predicción
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
