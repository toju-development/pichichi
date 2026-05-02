/**
 * Smoke test para `TournamentCard`.
 *
 * Verifica nombre, type label, status label correcto (live vs no-live), date
 * range formateado y el link al detail. `next/link` se stubea a un `<a>`
 * para que jsdom no necesite el AppRouter context (mismo patrón que
 * `group-card.test.tsx`).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TournamentDto } from "@pichichi/shared";

import { ROUTES } from "@/lib/routes";
import { TournamentCard } from "../tournament-card";

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
    name: "Mundial 2026",
    slug: "mundial-2026",
    type: "WORLD_CUP",
    description: null,
    logoUrl: null,
    startDate: "2026-06-11T00:00:00.000Z",
    endDate: "2026-07-19T00:00:00.000Z",
    status: "UPCOMING",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    teamCount: 48,
    ...overrides,
  };
}

describe("TournamentCard", () => {
  it("renderiza nombre, type label, fechas, team count y link al detalle", () => {
    const tournament = makeTournament();
    render(<TournamentCard tournament={tournament} />);

    expect(screen.getByTestId("tournament-card-name")).toHaveTextContent(
      "Mundial 2026",
    );
    expect(screen.getByText("Copa del Mundo")).toBeInTheDocument();
    expect(screen.getByTestId("tournament-card-dates")).toHaveTextContent(
      "11 Jun - 19 Jul 2026",
    );
    expect(screen.getByTestId("tournament-card-teams")).toHaveTextContent(
      "48 equipos",
    );

    const link = screen.getByTestId("tournament-card-mundial-2026");
    expect(link).toHaveAttribute(
      "href",
      ROUTES.app.tournamentDetail("mundial-2026"),
    );
  });

  it("usa singular `equipo` cuando teamCount es 1", () => {
    render(<TournamentCard tournament={makeTournament({ teamCount: 1 })} />);
    expect(screen.getByTestId("tournament-card-teams")).toHaveTextContent(
      "1 equipo",
    );
  });

  it("oculta el counter de equipos si teamCount es undefined", () => {
    render(
      <TournamentCard tournament={makeTournament({ teamCount: undefined })} />,
    );
    expect(screen.queryByTestId("tournament-card-teams")).toBeNull();
  });

  it("muestra el badge IN_PROGRESS con los estilos live cuando status es IN_PROGRESS", () => {
    render(
      <TournamentCard tournament={makeTournament({ status: "IN_PROGRESS" })} />,
    );
    const badge = screen.getByTestId("tournament-card-status-in_progress");
    expect(badge).toHaveTextContent("En curso");
    expect(badge.className).toContain("text-success");
  });

  it("muestra el badge UPCOMING en estilo neutro", () => {
    render(<TournamentCard tournament={makeTournament()} />);
    const badge = screen.getByTestId("tournament-card-status-upcoming");
    expect(badge).toHaveTextContent("Próximamente");
    expect(badge.className).toContain("text-text-secondary");
  });
});
