/**
 * Tournament Toggle Script
 *
 * Activates or deactivates a tournament by shifting all match dates
 * and resetting (or setting) match results. Useful for testing the app
 * with a tournament that starts "tomorrow" or one that's fully finished.
 *
 * Usage:
 *   npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --activate
 *   npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --deactivate
 *   npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --activate --force
 *
 * Or via npm script:
 *   npm run toggle-tournament -- --slug world-cup-2022 --activate
 *   npm run toggle-tournament -- --slug world-cup-2022 --deactivate
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

const MODE = {
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
} as const;

type Mode = (typeof MODE)[keyof typeof MODE];

interface CliArgs {
  slug: string;
  mode: Mode;
  force: boolean;
}

function printHelp(): void {
  console.log(`
Tournament Toggle Script — Pichichi

USAGE:
  npx tsx src/database/seeds/toggle-tournament.ts --slug <slug> --activate|--deactivate [--force]

OPTIONS:
  --slug <slug>       Tournament slug (required)
  --activate          Shift matches to the future, reset scores, set status UPCOMING
  --deactivate        Shift matches to the past, set dummy scores, set status FINISHED
  --force             Skip confirmation prompt
  --help              Show this help message

EXAMPLES:
  # Activate a tournament (first match starts tomorrow)
  npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --activate

  # Deactivate a tournament (last match was yesterday)
  npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --deactivate

  # Skip confirmation
  npx tsx src/database/seeds/toggle-tournament.ts --slug world-cup-2022 --activate --force
`);
}

function parseArgs(argv: string[]): CliArgs | null {
  const args = argv.slice(2);

  if (args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.length === 0) {
    printHelp();
    return null;
  }

  let slug: string | undefined;
  let mode: Mode | undefined;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--slug': {
        const val = args[++i];
        if (!val || val.startsWith('--')) {
          console.error('❌ Error: --slug requires a slug argument');
          return null;
        }
        slug = val;
        break;
      }
      case '--activate':
        if (mode === MODE.DEACTIVATE) {
          console.error(
            '❌ Error: --activate and --deactivate are mutually exclusive',
          );
          return null;
        }
        mode = MODE.ACTIVATE;
        break;
      case '--deactivate':
        if (mode === MODE.ACTIVATE) {
          console.error(
            '❌ Error: --activate and --deactivate are mutually exclusive',
          );
          return null;
        }
        mode = MODE.DEACTIVATE;
        break;
      case '--force':
        force = true;
        break;
      default:
        console.error(`❌ Error: Unknown argument "${arg}"`);
        printHelp();
        return null;
    }
  }

  if (!slug) {
    console.error('❌ Error: --slug is required');
    return null;
  }

  if (!mode) {
    console.error('❌ Error: --activate or --deactivate is required');
    return null;
  }

  return { slug, mode, force };
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

async function confirmAction(
  slug: string,
  mode: Mode,
  matchCount: number,
): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const action =
    mode === MODE.ACTIVATE
      ? 'ACTIVATE (shift to future, reset scores)'
      : 'DEACTIVATE (shift to past, set dummy scores)';

  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  You are about to ${action}\n` +
        `   Tournament: "${slug}"\n` +
        `   Matches affected: ${matchCount}\n\n` +
        '   Continue? (y/N) ',
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'y');
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function shiftDate(date: Date, offsetMs: number): Date {
  return new Date(date.getTime() + offsetMs);
}

// ---------------------------------------------------------------------------
// Activate
// ---------------------------------------------------------------------------

async function activateTournament(slug: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      matches: {
        orderBy: { scheduledAt: 'asc' },
      },
    },
  });

  if (!tournament) {
    console.error(`\n❌ Tournament not found: "${slug}"`);
    process.exit(1);
  }

  if (tournament.matches.length === 0) {
    console.error(`\n❌ Tournament "${slug}" has no matches. Nothing to do.`);
    process.exit(1);
  }

  const firstMatch = tournament.matches[0];
  const now = new Date();
  const targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // NOW + 1 day
  const offsetMs = targetDate.getTime() - firstMatch.scheduledAt.getTime();

  console.log(`\n🏆 Tournament: ${tournament.name} (${slug})`);
  console.log(`  Current status: ${tournament.status}`);
  console.log(`  Matches: ${tournament.matches.length}`);
  console.log(`  First match: ${formatDate(firstMatch.scheduledAt)}`);
  console.log(`  Offset: ${(offsetMs / (1000 * 60 * 60 * 24)).toFixed(1)} days`);

  const newStartDate = shiftDate(tournament.startDate, offsetMs);
  const newEndDate = shiftDate(tournament.endDate, offsetMs);
  const newFirstMatch = shiftDate(firstMatch.scheduledAt, offsetMs);
  const lastMatch = tournament.matches[tournament.matches.length - 1];
  const newLastMatch = shiftDate(lastMatch.scheduledAt, offsetMs);

  console.log(`\n  New date range: ${formatDate(newFirstMatch)} → ${formatDate(newLastMatch)}`);

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // Update all matches: shift dates + reset scores
    for (const match of tournament.matches) {
      await tx.match.update({
        where: { id: match.id },
        data: {
          scheduledAt: shiftDate(match.scheduledAt, offsetMs),
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          homeScorePenalties: null,
          awayScorePenalties: null,
          isExtraTime: false,
        },
      });
    }

    // Update tournament
    await tx.tournament.update({
      where: { id: tournament.id },
      data: {
        status: 'UPCOMING',
        startDate: newStartDate,
        endDate: newEndDate,
      },
    });
  });

  console.log(`\n✅ Tournament ACTIVATED`);
  console.log(`  ${tournament.matches.length} matches updated → status: SCHEDULED, scores: reset`);
  console.log(`  Tournament status → UPCOMING`);
  console.log(`  Date range: ${formatDate(newStartDate)} → ${formatDate(newEndDate)}`);
}

// ---------------------------------------------------------------------------
// Deactivate
// ---------------------------------------------------------------------------

async function deactivateTournament(slug: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      matches: {
        orderBy: { scheduledAt: 'asc' },
      },
    },
  });

  if (!tournament) {
    console.error(`\n❌ Tournament not found: "${slug}"`);
    process.exit(1);
  }

  if (tournament.matches.length === 0) {
    console.error(`\n❌ Tournament "${slug}" has no matches. Nothing to do.`);
    process.exit(1);
  }

  const lastMatch = tournament.matches[tournament.matches.length - 1];
  const now = new Date();
  const targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // NOW - 1 day
  const offsetMs = targetDate.getTime() - lastMatch.scheduledAt.getTime();

  console.log(`\n🏆 Tournament: ${tournament.name} (${slug})`);
  console.log(`  Current status: ${tournament.status}`);
  console.log(`  Matches: ${tournament.matches.length}`);
  console.log(`  Last match: ${formatDate(lastMatch.scheduledAt)}`);
  console.log(`  Offset: ${(offsetMs / (1000 * 60 * 60 * 24)).toFixed(1)} days`);

  const newStartDate = shiftDate(tournament.startDate, offsetMs);
  const newEndDate = shiftDate(tournament.endDate, offsetMs);
  const firstMatch = tournament.matches[0];
  const newFirstMatch = shiftDate(firstMatch.scheduledAt, offsetMs);
  const newLastMatch = shiftDate(lastMatch.scheduledAt, offsetMs);

  console.log(`\n  New date range: ${formatDate(newFirstMatch)} → ${formatDate(newLastMatch)}`);

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // Update all matches: shift dates + set dummy scores
    for (const match of tournament.matches) {
      await tx.match.update({
        where: { id: match.id },
        data: {
          scheduledAt: shiftDate(match.scheduledAt, offsetMs),
          status: 'FINISHED',
          homeScore: 0,
          awayScore: 0,
          homeScorePenalties: null,
          awayScorePenalties: null,
          isExtraTime: false,
        },
      });
    }

    // Update tournament
    await tx.tournament.update({
      where: { id: tournament.id },
      data: {
        status: 'FINISHED',
        startDate: newStartDate,
        endDate: newEndDate,
      },
    });
  });

  console.log(`\n✅ Tournament DEACTIVATED`);
  console.log(`  ${tournament.matches.length} matches updated → status: FINISHED, scores: 0-0`);
  console.log(`  Tournament status → FINISHED`);
  console.log(`  Date range: ${formatDate(newStartDate)} → ${formatDate(newEndDate)}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (!args) {
    process.exit(1);
  }

  // Pre-flight: check tournament exists and get match count for confirmation
  const tournament = await prisma.tournament.findUnique({
    where: { slug: args.slug },
    include: { _count: { select: { matches: true } } },
  });

  if (!tournament) {
    console.error(`\n❌ Tournament not found: "${args.slug}"`);
    process.exit(1);
  }

  if (!args.force) {
    const confirmed = await confirmAction(
      args.slug,
      args.mode,
      tournament._count.matches,
    );
    if (!confirmed) {
      console.log('\n❌ Cancelled.\n');
      return;
    }
  }

  if (args.mode === MODE.ACTIVATE) {
    await activateTournament(args.slug);
  } else {
    await deactivateTournament(args.slug);
  }
}

main()
  .catch((error) => {
    console.error('❌ Toggle failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
