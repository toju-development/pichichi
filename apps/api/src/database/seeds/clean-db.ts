/**
 * Database Cleanup Script
 *
 * Deletes ALL data from the database while preserving ONLY user accounts
 * and plans (auth data). Everything else is wiped: tournaments, teams,
 * matches, players, predictions, groups, notifications, etc.
 *
 * Delete order respects foreign key constraints (children before parents).
 *
 * Usage:
 *   npx tsx src/database/seeds/clean-db.ts
 *   npx tsx src/database/seeds/clean-db.ts --force
 *
 * Or via npm script:
 *   npm run clean-db
 *   npm run clean-db -- --force
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function hasForceFlag(): boolean {
  return process.argv.includes('--force');
}

async function confirmDeletion(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  This will delete ALL data except user accounts and plans.\n' +
        '   Tournaments, teams, matches, players, predictions, groups,\n' +
        '   notifications — everything gets wiped.\n\n' +
        '   Continue? (y/N) ',
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'y');
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Cleanup Pipeline
// ---------------------------------------------------------------------------

interface DeleteResult {
  label: string;
  count: number;
}

async function cleanDatabase(): Promise<void> {
  console.log('\n🧹 Cleaning database (preserving users & plans)...\n');

  const results: DeleteResult[] = [];

  // Order: children → parents (respecting FK constraints)

  // 1. Notification (refs: User)
  const notifications = await prisma.notification.deleteMany();
  results.push({ label: 'Notifications', count: notifications.count });

  // 2. BonusPrediction (refs: User, Group, TournamentBonusType)
  const bonusPredictions = await prisma.bonusPrediction.deleteMany();
  results.push({ label: 'Bonus predictions', count: bonusPredictions.count });

  // 3. Prediction (refs: User, Match, Group)
  const predictions = await prisma.prediction.deleteMany();
  results.push({ label: 'Predictions', count: predictions.count });

  // 4. TournamentPlayer (refs: Tournament, Team, Player)
  const tournamentPlayers = await prisma.tournamentPlayer.deleteMany();
  results.push({ label: 'Tournament players', count: tournamentPlayers.count });

  // 5. Player (no FK parents, but TournamentPlayer refs it)
  const players = await prisma.player.deleteMany();
  results.push({ label: 'Players', count: players.count });

  // 6. Match (refs: Tournament, Team via home/away)
  const matches = await prisma.match.deleteMany();
  results.push({ label: 'Matches', count: matches.count });

  // 7. TournamentBonusType (refs: Tournament)
  const bonusTypes = await prisma.tournamentBonusType.deleteMany();
  results.push({ label: 'Tournament bonus types', count: bonusTypes.count });

  // 8. TournamentPhase (refs: Tournament)
  const phases = await prisma.tournamentPhase.deleteMany();
  results.push({ label: 'Tournament phases', count: phases.count });

  // 9. GroupTournament (refs: Group, Tournament — link table)
  const groupTournaments = await prisma.groupTournament.deleteMany();
  results.push({ label: 'Group-tournament links', count: groupTournaments.count });

  // 10. TournamentTeam (refs: Tournament, Team)
  const tournamentTeams = await prisma.tournamentTeam.deleteMany();
  results.push({ label: 'Tournament teams', count: tournamentTeams.count });

  // 11. GroupMember (refs: Group, User)
  const groupMembers = await prisma.groupMember.deleteMany();
  results.push({ label: 'Group members', count: groupMembers.count });

  // 12. Team (no FK children at this point)
  const teams = await prisma.team.deleteMany();
  results.push({ label: 'Teams', count: teams.count });

  // 13. Tournament (no FK children at this point)
  const tournaments = await prisma.tournament.deleteMany();
  results.push({ label: 'Tournaments', count: tournaments.count });

  // 14. Group (all children deleted above)
  const groups = await prisma.group.deleteMany();
  results.push({ label: 'Groups', count: groups.count });

  // Print results
  for (const { label, count } of results) {
    console.log(`  ✅ ${label}: ${count} deleted`);
  }

  console.log('\n🧹 Done! Database cleaned (users & plans preserved).\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const force = hasForceFlag();

  if (!force) {
    const confirmed = await confirmDeletion();

    if (!confirmed) {
      console.log('\n❌ Cancelled.\n');
      return;
    }
  }

  await cleanDatabase();
}

main()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
