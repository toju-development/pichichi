import type {
  TournamentBonusTypeDto,
  TournamentDto,
  TournamentPhaseDto,
} from "@pichichi/shared";

export const MOCK_TOURNAMENT_PHASES: TournamentPhaseDto[] = [
  { id: "phase-group", phase: "GROUP_STAGE", multiplier: 1, sortOrder: 1 },
  { id: "phase-r16", phase: "ROUND_OF_16", multiplier: 2, sortOrder: 2 },
  { id: "phase-qf", phase: "QUARTER_FINAL", multiplier: 3, sortOrder: 3 },
  { id: "phase-sf", phase: "SEMI_FINAL", multiplier: 4, sortOrder: 4 },
  { id: "phase-final", phase: "FINAL", multiplier: 5, sortOrder: 5 },
];

export const MOCK_TOURNAMENT_BONUS_TYPES: TournamentBonusTypeDto[] = [
  { id: "bonus-champion", key: "CHAMPION", label: "Campeón", points: 30, sortOrder: 1 },
  { id: "bonus-topscorer", key: "TOP_SCORER", label: "Goleador", points: 20, sortOrder: 2 },
];

export const MOCK_TOURNAMENT: TournamentDto = {
  id: "tournament-1",
  name: "Mundial 2026",
  slug: "mundial-2026",
  type: "WORLD_CUP",
  description: "Mundial de prueba",
  logoUrl: null,
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-07-15T00:00:00.000Z",
  status: "IN_PROGRESS",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  phases: MOCK_TOURNAMENT_PHASES,
  bonusTypes: MOCK_TOURNAMENT_BONUS_TYPES,
  teamCount: 32,
};

export const MOCK_TOURNAMENTS: TournamentDto[] = [MOCK_TOURNAMENT];
