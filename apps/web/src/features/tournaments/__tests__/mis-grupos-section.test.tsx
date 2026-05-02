/**
 * Smoke tests para `MisGruposSection`.
 *
 * Cubre las 4 ramas del render gating + el render normal:
 *   - usuario no autenticado → null
 *   - cargando (isLoading=true) → null
 *   - sin grupos (data=[]) → null
 *   - con grupos → render con cards y links a `/app/groups/{id}/tournament/{slug}`
 *
 * `useMyGroupsByTournament` se mockea para evitar acoplar a TanStack Query / red.
 * `useAuthStore` (Zustand real) se setea con `setState`, mismo patrón que
 * `leaderboard-list.test.tsx` y `socket-provider.test.tsx`.
 *
 * `next/link` se stubea a un `<a>`, mismo patrón que `tournament-header.test.tsx`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { GroupDto, GroupMemberRole } from "@pichichi/shared";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-groups", () => ({
  useMyGroupsByTournament: vi.fn(),
}));

import { useMyGroupsByTournament } from "@/hooks/use-groups";
import { useAuthStore } from "@/stores/auth-store";
import { MisGruposSection } from "@/features/tournaments/mis-grupos-section";

const useMyGroupsByTournamentMock = vi.mocked(useMyGroupsByTournament);

function makeGroup(overrides: Partial<GroupDto> = {}): GroupDto {
  return {
    id: "g-1",
    name: "Los Pichichis",
    description: null,
    inviteCode: null,
    createdBy: "u-1",
    maxMembers: 10,
    memberCount: 3,
    userRole: "OWNER" as GroupMemberRole,
    userPoints: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setQuery(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useMyGroupsByTournamentMock.mockReturnValue(state as any);
}

function setAuthenticated(value: boolean) {
  useAuthStore.setState({
    accessToken: value ? "tok" : null,
    refreshToken: value ? "ref" : null,
    user: value
      ? {
          id: "u-1",
          email: "x@y.com",
          displayName: "Me",
          username: "me",
          avatarUrl: null,
          plan: {
            id: "p",
            name: "Free",
            maxGroupsCreated: 1,
            maxMemberships: 1,
            maxMembersPerGroup: 1,
            maxTournamentsPerGroup: 1,
          },
          createdAt: "2026-01-01T00:00:00.000Z",
        }
      : null,
    isAuthenticated: value,
    isHydrated: true,
  });
}

beforeEach(() => {
  setAuthenticated(true);
});

afterEach(() => {
  cleanup();
  useMyGroupsByTournamentMock.mockReset();
  setAuthenticated(false);
});

describe("MisGruposSection", () => {
  it("no renderiza nada cuando el usuario no está autenticado", () => {
    setAuthenticated(false);
    setQuery({ isLoading: false, data: [makeGroup()] });

    const { container } = render(
      <MisGruposSection tournamentId="t-1" tournamentSlug="eurocopa-2028" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada mientras la query carga", () => {
    setQuery({ isLoading: true, data: undefined });

    const { container } = render(
      <MisGruposSection tournamentId="t-1" tournamentSlug="eurocopa-2028" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("no renderiza nada cuando no hay grupos", () => {
    setQuery({ isLoading: false, data: [] });

    const { container } = render(
      <MisGruposSection tournamentId="t-1" tournamentSlug="eurocopa-2028" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza una card por cada grupo con link al per-group tournament", () => {
    const groups = [
      makeGroup({ id: "g-1", name: "Los Pichichis" }),
      makeGroup({ id: "g-2", name: "Amigos del Fútbol" }),
    ];
    setQuery({ isLoading: false, data: groups });

    render(
      <MisGruposSection tournamentId="t-1" tournamentSlug="eurocopa-2028" />,
    );

    expect(screen.getByTestId("mis-grupos-section")).toBeInTheDocument();
    expect(screen.getByText("Mis Grupos")).toBeInTheDocument();

    const card1 = screen.getByTestId("mis-grupos-card-g-1");
    const card2 = screen.getByTestId("mis-grupos-card-g-2");

    expect(card1).toHaveAttribute(
      "href",
      "/app/groups/g-1/tournament/eurocopa-2028",
    );
    expect(card2).toHaveAttribute(
      "href",
      "/app/groups/g-2/tournament/eurocopa-2028",
    );
    expect(card1).toHaveTextContent("Los Pichichis");
    expect(card2).toHaveTextContent("Amigos del Fútbol");
  });
});
