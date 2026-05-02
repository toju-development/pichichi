/**
 * ScoreInput component tests.
 *
 * Cubre:
 *   - render de ambas columnas con team name + input numérico
 *   - input acepta type=number con min=0, max=99 e inputMode=numeric
 *   - onHomeChange/onAwayChange disparados con valor parseado
 *   - clamp: valores > 99 se limitan a 99, < 0 se limitan a 0
 *   - aria-labels descriptivas
 *   - disabled propaga a ambos inputs
 *   - avatar con logoUrl renderiza <img>; sin logoUrl renderiza initials
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import type { MatchTeamDto } from "@pichichi/shared";

import { ScoreInput } from "@/features/predictions/score-input";

const argTeam: MatchTeamDto = {
  id: "t-arg",
  name: "Argentina",
  shortName: "ARG",
  logoUrl: null,
};

const fraTeam: MatchTeamDto = {
  id: "t-fra",
  name: "Francia",
  shortName: "FRA",
  logoUrl: "https://example.com/fra.png",
};

describe("ScoreInput", () => {
  it("renderiza ambos team names + ambos inputs numéricos", () => {
    render(
      <ScoreInput
        homeTeamName="Argentina"
        awayTeamName="Francia"
        homeTeam={argTeam}
        awayTeam={fraTeam}
        homeScore={2}
        awayScore={1}
        onHomeChange={vi.fn()}
        onAwayChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Francia")).toBeInTheDocument();

    const home = screen.getByTestId("score-input-home") as HTMLInputElement;
    const away = screen.getByTestId("score-input-away") as HTMLInputElement;

    expect(home.type).toBe("number");
    expect(away.type).toBe("number");
    expect(home.min).toBe("0");
    expect(home.max).toBe("99");
    expect(home.inputMode).toBe("numeric");
    expect(home.value).toBe("2");
    expect(away.value).toBe("1");
  });

  it("dispara onHomeChange/onAwayChange con valores parseados", () => {
    const onHome = vi.fn();
    const onAway = vi.fn();
    render(
      <ScoreInput
        homeTeamName="Argentina"
        awayTeamName="Francia"
        homeScore={0}
        awayScore={0}
        onHomeChange={onHome}
        onAwayChange={onAway}
      />,
    );

    fireEvent.change(screen.getByTestId("score-input-home"), {
      target: { value: "3" },
    });
    expect(onHome).toHaveBeenCalledWith(3);

    fireEvent.change(screen.getByTestId("score-input-away"), {
      target: { value: "5" },
    });
    expect(onAway).toHaveBeenCalledWith(5);
  });

  it("clamp: valores fuera de rango se limitan a 0 y 99", () => {
    const onHome = vi.fn();
    render(
      <ScoreInput
        homeTeamName="A"
        awayTeamName="B"
        homeScore={0}
        awayScore={0}
        onHomeChange={onHome}
        onAwayChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("score-input-home"), {
      target: { value: "150" },
    });
    expect(onHome).toHaveBeenLastCalledWith(99);

    fireEvent.change(screen.getByTestId("score-input-home"), {
      target: { value: "-10" },
    });
    expect(onHome).toHaveBeenLastCalledWith(0);

    // NaN (input vacío) → cae al min
    fireEvent.change(screen.getByTestId("score-input-home"), {
      target: { value: "" },
    });
    expect(onHome).toHaveBeenLastCalledWith(0);
  });

  it("aria-labels descriptivas con el nombre del equipo", () => {
    render(
      <ScoreInput
        homeTeamName="Argentina"
        awayTeamName="Francia"
        homeScore={0}
        awayScore={0}
        onHomeChange={vi.fn()}
        onAwayChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Goles de Argentina")).toBeInTheDocument();
    expect(screen.getByLabelText("Goles de Francia")).toBeInTheDocument();
  });

  it("disabled deshabilita ambos inputs", () => {
    render(
      <ScoreInput
        homeTeamName="A"
        awayTeamName="B"
        homeScore={0}
        awayScore={0}
        onHomeChange={vi.fn()}
        onAwayChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByTestId("score-input-home")).toBeDisabled();
    expect(screen.getByTestId("score-input-away")).toBeDisabled();
  });

  it("avatar: con logoUrl renderiza <img>; sin logoUrl renderiza initials", () => {
    render(
      <ScoreInput
        homeTeamName="Argentina"
        awayTeamName="Francia"
        homeTeam={argTeam}
        awayTeam={fraTeam}
        homeScore={0}
        awayScore={0}
        onHomeChange={vi.fn()}
        onAwayChange={vi.fn()}
      />,
    );

    // Francia → tiene logoUrl
    const img = screen.getByAltText("Francia") as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.src).toBe("https://example.com/fra.png");

    // Argentina → sin logoUrl, fallback a iniciales "A" (primera palabra)
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
