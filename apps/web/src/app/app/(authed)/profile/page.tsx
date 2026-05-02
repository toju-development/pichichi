"use client";

/**
 * Profile page — `/app/profile`.
 *
 * Port web read-only de `apps/mobile/app/(tabs)/profile.tsx`.
 *
 * Composición:
 *   - useAuthStore        → user identity (displayName, username, email)
 *   - useDashboard        → stats (totalPredictions, exactCount, totalPoints,
 *                           accuracy, groupCount)
 *   - useGlobalLeaderboard → currentUserEntry.position
 *
 * Layout (mobile parity):
 *   ┌────────────────────────────────────────┐
 *   │ Green header: avatar · name/email      │
 *   ├────────────────────────────────────────┤
 *   │ Mis Estadísticas                       │
 *   │ ┌─────┬─────┬─────┐                    │
 *   │ │ Pron│Exac │Punto│                    │
 *   │ ├─────┼─────┼─────┤                    │
 *   │ │ Acie│Rank │Grup │                    │
 *   │ └─────┴─────┴─────┘                    │
 *   ├────────────────────────────────────────┤
 *   │ [ Cerrar sesión ]                      │
 *   └────────────────────────────────────────┘
 *
 * Decisión sobre `metadata`:
 *   En este proyecto las pages dentro de `(authed)` son Client Components
 *   (mismo patrón que `notifications/page.tsx` y `tournaments/[slug]/page.tsx`),
 *   por lo que NO podemos exportar `metadata` desde acá ("use client" + metadata
 *   son mutuamente excluyentes en una misma file). El `<title>` cae al layout
 *   raíz; mantenemos paridad con mobile (mobile tampoco maneja metadata HTML).
 *
 * Profile read-only por proposal scope: la edición vive sólo en mobile. El
 * único CTA es el logout.
 */

import { LoadingScreen } from "@/features/shared";
import {
  LogoutCard,
  ProfileHeader,
  StatsGrid,
} from "@/features/profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { useGlobalLeaderboard } from "@/hooks/use-leaderboard";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: dashboardData, isLoading: dashLoading } = useDashboard();
  const { currentUserEntry, isLoading: lbLoading } = useGlobalLeaderboard();

  const displayName = user?.displayName ?? "Usuario";
  const username = user?.username ?? "";
  const email = user?.email ?? "";

  const isLoading = dashLoading || lbLoading;

  return (
    <section
      data-testid="page-profile"
      className="flex flex-col gap-5"
    >
      <ProfileHeader
        displayName={displayName}
        username={username}
        email={email}
      />

      {isLoading ? (
        <LoadingScreen testId="page-profile-loading" />
      ) : (
        <>
          <h2 className="text-base font-bold text-text-primary">
            Mis Estadísticas
          </h2>

          <StatsGrid
            stats={dashboardData?.stats ?? null}
            position={currentUserEntry?.position ?? null}
          />

          <LogoutCard />
        </>
      )}
    </section>
  );
}
