import type { MatchDto, MatchTeamDto } from "@pichichi/shared";

import { MOCK_TOURNAMENT } from "./tournaments";

/**
 * Far-future kickoffs so `isMatchLocked` (which locks 5 minutes before
 * scheduledAt) never trips during E2E runs. We keep the dates static so
 * snapshots / network mocks remain deterministic.
 */
const KICKOFF_PRIMARY = "2099-06-15T20:00:00.000Z";
const KICKOFF_SECONDARY = "2099-06-16T20:00:00.000Z";

export const MOCK_TEAM_HOME: MatchTeamDto = {
  id: "team-arg",
  name: "Argentina",
  shortName: "ARG",
  logoUrl: null,
};

export const MOCK_TEAM_AWAY: MatchTeamDto = {
  id: "team-bra",
  name: "Brasil",
  shortName: "BRA",
  logoUrl: null,
};

export const MOCK_TEAM_AWAY_SECONDARY: MatchTeamDto = {
  id: "team-uru",
  name: "Uruguay",
  shortName: "URU",
  logoUrl: null,
};

export const MOCK_MATCH_SCHEDULED: MatchDto = {
  id: "match-1",
  tournamentId: MOCK_TOURNAMENT.id,
  homeTeam: MOCK_TEAM_HOME,
  awayTeam: MOCK_TEAM_AWAY,
  phase: "GROUP_STAGE",
  groupName: "A",
  matchNumber: 1,
  scheduledAt: KICKOFF_PRIMARY,
  venue: "Estadio Monumental",
  city: "Buenos Aires",
  status: "SCHEDULED",
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
};

export const MOCK_MATCH_SCHEDULED_SECONDARY: MatchDto = {
  ...MOCK_MATCH_SCHEDULED,
  id: "match-2",
  awayTeam: MOCK_TEAM_AWAY_SECONDARY,
  matchNumber: 2,
  scheduledAt: KICKOFF_SECONDARY,
};

export const MOCK_MATCHES: MatchDto[] = [MOCK_MATCH_SCHEDULED, MOCK_MATCH_SCHEDULED_SECONDARY];
