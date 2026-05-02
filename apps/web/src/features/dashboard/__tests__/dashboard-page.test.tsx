/**
 * Smoke test del dashboard page.
 *
 * Mockeamos `useDashboard` para devolver un `DashboardResponseDto` válido y
 * verificamos:
 *   - Render sin crash con el testid de la página
 *   - Stats render con los valores que pasamos
 *   - Sección de partidos del día con su testid
 *   - Sección de grupos con su testid
 *
 * Mockeamos `next/link` para que sea un `<a>` normal — evita necesitar el
 * AppRouter context en jsdom.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DashboardResponseDto } from "@pichichi/shared";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const useDashboardMock = vi.fn();
vi.mock("@/hooks/use-dashboard", () => ({
  useDashboard: () => useDashboardMock(),
}));

import DashboardPage from "@/app/app/(authed)/page";

const fixture: DashboardResponseDto = {
  stats: {
    totalPoints: 142,
    totalPredictions: 30,
    exactCount: 5,
    accuracy: 73.4,
    groupCount: 2,
  },
  todayMatches: [],
  groups: [
    {
      groupId: "g1",
      groupName: "Los del finde",
      userPosition: 3,
      totalMembers: 8,
      userPoints: 142,
      topEntries: [],
    },
  ],
};

describe("DashboardPage", () => {
  it("renderiza las 3 secciones cuando hay data válida", () => {
    useDashboardMock.mockReturnValue({
      data: fixture,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-user-stats")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-today-matches")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-group-rankings")).toBeInTheDocument();

    // Stats: totalPoints renderizado dentro de la sección de stats
    const statsSection = screen.getByTestId("dashboard-user-stats");
    expect(within(statsSection).getByText("142")).toBeInTheDocument();
    // Accuracy redondeado
    expect(within(statsSection).getByText("73%")).toBeInTheDocument();
    // Group card visible
    expect(screen.getByText("Los del finde")).toBeInTheDocument();
  });
});
