/**
 * Unit tests para los filtros de matches usados por la pantalla de torneo
 * por grupo (4 tabs: Pronósticos / Resultados / Bonus / Ranking).
 *
 * Cubre los 4 helpers añadidos en Phase 5B.5:
 *   - getPredictableMatches: SCHEDULED y NO bloqueado por buffer
 *   - getLockedScheduledMatches: SCHEDULED pero dentro del buffer (kickoff inminente)
 *   - getLiveMatches: status === LIVE
 *   - getFinishedMatches: status === FINISHED
 *
 * Usa fake timers de Vitest para fijar `Date.now()` y poder razonar sobre
 * el buffer de 5 minutos definido por `LOCK_BUFFER_MINUTES`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MatchDto, MatchPhase, MatchStatus } from "@pichichi/shared";
import { LOCK_BUFFER_MINUTES } from "@pichichi/shared";

import {
  getFinishedMatches,
  getLiveMatches,
  getLockedScheduledMatches,
  getPredictableMatches,
} from "@/utils/match-helpers";

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** Fixed "now" anchor — simplifica razonar sobre el buffer. */
const NOW = new Date("2026-06-11T12:00:00.000Z");

function makeMatch(
  id: string,
  status: MatchStatus,
  scheduledAt: string,
  overrides: Partial<MatchDto> = {},
): MatchDto {
  return {
    id,
    tournamentId: "t-1",
    homeTeam: null,
    awayTeam: null,
    phase: "GROUP_STAGE" as MatchPhase,
    groupName: null,
    matchNumber: null,
    scheduledAt,
    venue: null,
    city: null,
    status,
    homeScore: null,
    awayScore: null,
    homeScorePenalties: null,
    awayScorePenalties: null,
    isExtraTime: false,
    homeTeamPlaceholder: null,
    awayTeamPlaceholder: null,
    externalId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("getPredictableMatches", () => {
  it("incluye SCHEDULED con kickoff fuera del buffer", () => {
    // kickoff a 1h del NOW → muy lejos del buffer de 5min
    const future = new Date(NOW.getTime() + 60 * 60_000).toISOString();
    const m = makeMatch("m-1", "SCHEDULED", future);

    expect(getPredictableMatches([m])).toEqual([m]);
  });

  it("excluye SCHEDULED dentro del buffer (kickoff inminente)", () => {
    // kickoff a 2min del NOW → dentro del buffer de 5min → bloqueado
    const soon = new Date(NOW.getTime() + 2 * 60_000).toISOString();
    const m = makeMatch("m-1", "SCHEDULED", soon);

    expect(getPredictableMatches([m])).toEqual([]);
  });

  it("excluye matches en LIVE / FINISHED aunque estén lejos del buffer", () => {
    const future = new Date(NOW.getTime() + 60 * 60_000).toISOString();
    const live = makeMatch("m-live", "LIVE", future);
    const fin = makeMatch("m-fin", "FINISHED", future);

    expect(getPredictableMatches([live, fin])).toEqual([]);
  });

  it("filtra correctamente una mezcla heterogénea", () => {
    const far = new Date(NOW.getTime() + 60 * 60_000).toISOString();
    const near = new Date(NOW.getTime() + 60_000).toISOString();
    const matches = [
      makeMatch("a", "SCHEDULED", far),
      makeMatch("b", "SCHEDULED", near),
      makeMatch("c", "LIVE", far),
      makeMatch("d", "FINISHED", far),
    ];

    const result = getPredictableMatches(matches);
    expect(result.map((m) => m.id)).toEqual(["a"]);
  });
});

describe("getLockedScheduledMatches", () => {
  it("incluye SCHEDULED dentro del buffer", () => {
    const soon = new Date(
      NOW.getTime() + (LOCK_BUFFER_MINUTES - 1) * 60_000,
    ).toISOString();
    const m = makeMatch("m-1", "SCHEDULED", soon);

    expect(getLockedScheduledMatches([m])).toEqual([m]);
  });

  it("excluye SCHEDULED fuera del buffer", () => {
    const future = new Date(
      NOW.getTime() + (LOCK_BUFFER_MINUTES + 60) * 60_000,
    ).toISOString();
    const m = makeMatch("m-1", "SCHEDULED", future);

    expect(getLockedScheduledMatches([m])).toEqual([]);
  });

  it("excluye matches en LIVE / FINISHED aunque estén dentro del buffer", () => {
    const soon = new Date(NOW.getTime() + 60_000).toISOString();
    const live = makeMatch("m-live", "LIVE", soon);
    const fin = makeMatch("m-fin", "FINISHED", soon);

    expect(getLockedScheduledMatches([live, fin])).toEqual([]);
  });
});

describe("getLiveMatches", () => {
  it("retorna sólo los matches con status LIVE", () => {
    const ts = NOW.toISOString();
    const matches = [
      makeMatch("a", "SCHEDULED", ts),
      makeMatch("b", "LIVE", ts),
      makeMatch("c", "FINISHED", ts),
      makeMatch("d", "LIVE", ts),
    ];

    expect(getLiveMatches(matches).map((m) => m.id)).toEqual(["b", "d"]);
  });

  it("retorna [] cuando no hay LIVE", () => {
    const ts = NOW.toISOString();
    const matches = [
      makeMatch("a", "SCHEDULED", ts),
      makeMatch("c", "FINISHED", ts),
    ];

    expect(getLiveMatches(matches)).toEqual([]);
  });
});

describe("getFinishedMatches", () => {
  it("retorna sólo los matches con status FINISHED", () => {
    const ts = NOW.toISOString();
    const matches = [
      makeMatch("a", "SCHEDULED", ts),
      makeMatch("b", "LIVE", ts),
      makeMatch("c", "FINISHED", ts),
      makeMatch("d", "FINISHED", ts),
    ];

    expect(getFinishedMatches(matches).map((m) => m.id)).toEqual(["c", "d"]);
  });

  it("retorna [] cuando no hay FINISHED", () => {
    const ts = NOW.toISOString();
    expect(
      getFinishedMatches([
        makeMatch("a", "SCHEDULED", ts),
        makeMatch("b", "LIVE", ts),
      ]),
    ).toEqual([]);
  });
});
