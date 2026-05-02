/**
 * Podium component smoke tests.
 *
 * Cubre paridad mobile:
 *   - render top 3 con medals 🥇🥈🥉, nombres y puntos
 *   - renderiza null si entries vacío
 *   - mantiene order por position aunque entries vengan desordenadas
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { LeaderboardEntryDto } from "@pichichi/shared";

import { Podium } from "@/features/leaderboard/podium";

function makeEntry(
  position: number,
  overrides: Partial<LeaderboardEntryDto> = {},
): LeaderboardEntryDto {
  return {
    position,
    userId: `u-${position}`,
    displayName: `User${position}`,
    username: `user${position}`,
    avatarUrl: null,
    totalPoints: 100 - position * 10,
    exactCount: 0,
    goalDiffCount: 0,
    winnerCount: 0,
    missCount: 0,
    bonusPoints: 0,
    streak: 0,
    ...overrides,
  };
}

describe("Podium", () => {
  it("renderiza top 3 con medals, nombres y puntos", () => {
    render(
      <Podium
        entries={[makeEntry(1), makeEntry(2), makeEntry(3)]}
      />,
    );

    expect(screen.getByTestId("podium")).toBeInTheDocument();
    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();
    expect(screen.getByText("User1")).toBeInTheDocument();
    expect(screen.getByText("User2")).toBeInTheDocument();
    expect(screen.getByText("User3")).toBeInTheDocument();
    expect(screen.getByText("90 pts")).toBeInTheDocument();
    expect(screen.getByText("80 pts")).toBeInTheDocument();
    expect(screen.getByText("70 pts")).toBeInTheDocument();
  });

  it("retorna null cuando entries está vacío", () => {
    const { container } = render(<Podium entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("ordena por position aunque entries vengan desordenadas", () => {
    render(
      <Podium
        entries={[makeEntry(3), makeEntry(1), makeEntry(2)]}
      />,
    );
    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("User1")).toBeInTheDocument();
  });
});
