import type { LeaderboardDto, LeaderboardEntryDto } from "@pichichi/shared";

import { MOCK_GROUP_PRIMARY } from "./groups";
import { MOCK_USER } from "./users";

const entry = (
  position: number,
  userId: string,
  displayName: string,
  username: string,
  totalPoints: number,
): LeaderboardEntryDto => ({
  position,
  userId,
  displayName,
  username,
  avatarUrl: null,
  totalPoints,
  exactCount: Math.max(0, 5 - position),
  goalDiffCount: 2,
  winnerCount: 3,
  missCount: position,
  bonusPoints: 0,
  streak: Math.max(0, 4 - position),
});

export const MOCK_LEADERBOARD_ENTRIES: LeaderboardEntryDto[] = [
  entry(1, "user-leader", "Sofía Vega", "sofiav", 120),
  entry(2, "user-second", "Lucas Romero", "lromero", 105),
  // Current user sits in position 3 so the test can assert highlight + podium.
  entry(3, MOCK_USER.id, MOCK_USER.displayName, MOCK_USER.username, 90),
  entry(4, "user-fourth", "Ana Torres", "atorres", 75),
  entry(5, "user-fifth", "Diego Pérez", "dperez", 60),
];

export const MOCK_LEADERBOARD: LeaderboardDto = {
  groupId: MOCK_GROUP_PRIMARY.id,
  groupName: MOCK_GROUP_PRIMARY.name,
  tournamentId: null,
  entries: MOCK_LEADERBOARD_ENTRIES,
  totalMembers: MOCK_LEADERBOARD_ENTRIES.length,
};
