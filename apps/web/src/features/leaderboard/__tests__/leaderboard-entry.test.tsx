/**
 * LeaderboardEntry smoke tests.
 *
 * Cubre el contrato visual de la fila individual:
 *   - render con datos básicos (position, displayName, totalPoints, exactCount)
 *   - highlight cuando isCurrentUser=true (`data-current-user="true"`,
 *     bg-primary-surface, displayName en font-bold)
 *   - colores de medal hex inline para top 1/2 (gold/silver), nada para >=3
 *   - singular vs plural de "exacto"/"exactos"
 *   - avatar con inicial cuando avatarUrl es null
 *   - avatar con <img> cuando avatarUrl está presente
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { LeaderboardEntryDto } from "@pichichi/shared";

import { LeaderboardEntry } from "@/features/leaderboard/leaderboard-entry";

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
    exactCount: 2,
    goalDiffCount: 0,
    winnerCount: 0,
    missCount: 0,
    bonusPoints: 0,
    streak: 0,
    ...overrides,
  };
}

describe("LeaderboardEntry", () => {
  it("renderiza datos básicos sin highlight cuando isCurrentUser=false", () => {
    render(
      <LeaderboardEntry entry={makeEntry(5)} isCurrentUser={false} />,
    );

    const row = screen.getByTestId("leaderboard-entry");
    expect(row).toBeInTheDocument();
    expect(row).not.toHaveAttribute("data-current-user", "true");
    expect(row.className).not.toContain("bg-primary-surface");
    expect(screen.getByText("User5")).toBeInTheDocument();
    // totalPoints = 100 - 5*10 = 50
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("pts")).toBeInTheDocument();
    expect(screen.getByText("2 exactos")).toBeInTheDocument();
  });

  it("aplica highlight cuando isCurrentUser=true", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(7, { displayName: "Me" })}
        isCurrentUser
      />,
    );

    const row = screen.getByTestId("leaderboard-entry");
    expect(row).toHaveAttribute("data-current-user", "true");
    expect(row.className).toContain("bg-primary-surface");

    const name = screen.getByText("Me");
    expect(name.className).toContain("font-bold");
  });

  it("aplica color gold (#FFD166) al position 1", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(1, { displayName: "Top1" })}
        isCurrentUser={false}
      />,
    );

    const positionSpan = screen.getByText("1");
    expect(positionSpan.getAttribute("style")).toContain("rgb(255, 209, 102)");
  });

  it("aplica color silver (#C0C0C0) al position 2", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(2, { displayName: "Top2" })}
        isCurrentUser={false}
      />,
    );

    const positionSpan = screen.getByText("2");
    expect(positionSpan.getAttribute("style")).toContain("rgb(192, 192, 192)");
  });

  it("position >= 3 no aplica style inline de color", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(3, { displayName: "Third" })}
        isCurrentUser={false}
      />,
    );

    const positionSpan = screen.getByText("3");
    expect(positionSpan.getAttribute("style") ?? "").not.toContain("rgb(");
  });

  it("usa singular 'exacto' cuando exactCount === 1", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(4, { exactCount: 1 })}
        isCurrentUser={false}
      />,
    );

    expect(screen.getByText("1 exacto")).toBeInTheDocument();
  });

  it("renderiza avatar con inicial cuando avatarUrl es null", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(6, { displayName: "alice", avatarUrl: null })}
        isCurrentUser={false}
      />,
    );

    // Inicial es la primera letra en MAYÚSCULA
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renderiza <img> cuando avatarUrl está presente", () => {
    render(
      <LeaderboardEntry
        entry={makeEntry(8, {
          displayName: "Bob",
          avatarUrl: "https://example.com/bob.png",
        })}
        isCurrentUser={false}
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/bob.png");
    expect(img).toHaveAttribute("alt", "Bob");
  });
});
