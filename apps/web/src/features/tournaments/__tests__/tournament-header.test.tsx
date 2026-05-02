/**
 * Smoke test para `TournamentHeader`.
 *
 * Verifica nombre, type label, status pill, fechas y back link.
 * `next/link` se stubea a un `<a>` (mismo patrón que tournament-card.test.tsx).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TournamentDto } from "@pichichi/shared";

import { ROUTES } from "@/lib/routes";
import { TournamentHeader } from "../tournament-header";

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

function makeTournament(overrides: Partial<TournamentDto> = {}): TournamentDto {
  return {
    id: "t-1",
    name: "Eurocopa 2028",
    slug: "eurocopa-2028",
    type: "EURO",
    description: null,
    logoUrl: null,
    startDate: "2028-06-09T00:00:00.000Z",
    endDate: "2028-07-09T00:00:00.000Z",
    status: "IN_PROGRESS",
    isActive: true,
    createdAt: "2028-01-01T00:00:00.000Z",
    updatedAt: "2028-01-01T00:00:00.000Z",
    teamCount: 24,
    ...overrides,
  };
}

describe("TournamentHeader", () => {
  it("renderiza nombre, type label, fechas, team count y back link", () => {
    render(<TournamentHeader tournament={makeTournament()} />);

    expect(screen.getByTestId("tournament-detail-name")).toHaveTextContent(
      "Eurocopa 2028",
    );
    expect(screen.getByTestId("tournament-detail-type")).toHaveTextContent(
      "Eurocopa",
    );
    expect(screen.getByTestId("tournament-detail-dates")).toHaveTextContent(
      "9 Jun - 9 Jul 2028",
    );
    expect(
      screen.getByTestId("tournament-detail-team-count"),
    ).toHaveTextContent("24 equipos");

    const back = screen.getByTestId("tournament-detail-back");
    expect(back).toHaveAttribute("href", ROUTES.app.tournaments);
  });

  it("muestra el status pill IN_PROGRESS con estilo live", () => {
    render(<TournamentHeader tournament={makeTournament()} />);
    const pill = screen.getByTestId("tournament-detail-status-in_progress");
    expect(pill).toHaveTextContent("En curso");
    expect(pill.className).toContain("text-success");
  });

  it("muestra el status pill FINISHED en estilo neutro", () => {
    render(
      <TournamentHeader tournament={makeTournament({ status: "FINISHED" })} />,
    );
    const pill = screen.getByTestId("tournament-detail-status-finished");
    expect(pill).toHaveTextContent("Finalizado");
    expect(pill.className).toContain("text-text-secondary");
  });

  it("oculta el team count cuando teamCount es undefined", () => {
    render(
      <TournamentHeader
        tournament={makeTournament({ teamCount: undefined })}
      />,
    );
    expect(screen.queryByTestId("tournament-detail-team-count")).toBeNull();
  });
});
