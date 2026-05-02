import type { Metadata } from "next";
import { EmptyState } from "@/features/shared";

export const metadata: Metadata = {
  title: "Ranking",
};

export default function LeaderboardPage() {
  return (
    <section data-testid="page-leaderboard" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text-primary">Ranking</h1>
        <p className="text-sm text-text-secondary">
          Tabla de posiciones por torneo.
        </p>
      </header>
      <EmptyState
        testId="page-leaderboard-empty"
        title="Todavía no hay puntajes"
        description="El ranking se llena con las primeras predicciones del torneo."
      />
    </section>
  );
}
