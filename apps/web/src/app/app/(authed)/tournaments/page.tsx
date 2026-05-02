"use client";

/**
 * Tournaments list page — `/app/tournaments`.
 *
 * Port literal de `apps/mobile/app/(tabs)/tournaments/index.tsx` adaptado
 * a la convención web (Tailwind + Link en lugar de StyleSheet + router.push).
 *
 * Cubre los mismos estados que mobile:
 *   - loading → `<LoadingScreen>`
 *   - error → `<ErrorState>` con retry
 *   - empty → `<EmptyState>` con copy literal
 *   - populated → lista de `<TournamentCard>` ordenados por API
 *
 * NOTA Phase 5A.3 — el listado **no** incluye refresh manual (no hay
 * `RefreshControl` web equivalente). React Query revalida automáticamente
 * en focus y respeta `staleTime`. Si hace falta, `tournamentsQuery.refetch()`
 * se invoca desde el botón "Reintentar" del ErrorState.
 */
import { useTournaments } from "@/hooks/use-tournaments";
import { EmptyState, ErrorState, LoadingScreen } from "@/features/shared";
import { TournamentCard } from "@/features/tournaments";

export default function TournamentsPage() {
  const tournamentsQuery = useTournaments();

  if (tournamentsQuery.isLoading) {
    return <LoadingScreen testId="page-tournaments-loading" />;
  }

  if (tournamentsQuery.isError) {
    return (
      <section data-testid="page-tournaments" className="flex flex-col gap-4">
        <Header />
        <ErrorState
          testId="page-tournaments-error"
          title="Error al cargar torneos"
          description="No se pudieron cargar los torneos. Probá de nuevo."
          onRetry={() => tournamentsQuery.refetch()}
        />
      </section>
    );
  }

  const tournaments = tournamentsQuery.data ?? [];
  const hasTournaments = tournaments.length > 0;

  return (
    <section data-testid="page-tournaments" className="flex flex-col gap-4">
      <Header />

      {hasTournaments ? (
        <ul
          data-testid="tournaments-list"
          className="flex flex-col gap-2"
        >
          {tournaments.map((tournament) => (
            <li key={tournament.id}>
              <TournamentCard tournament={tournament} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          testId="page-tournaments-empty"
          title="No hay torneos disponibles"
          description="Los torneos aparecerán acá cuando estén disponibles. ¡Volvé pronto!"
        />
      )}
    </section>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold text-text-primary">Torneos</h1>
      <p className="text-sm text-text-secondary">Competiciones disponibles</p>
    </header>
  );
}
