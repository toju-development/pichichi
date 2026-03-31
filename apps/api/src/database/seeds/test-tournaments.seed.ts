/**
 * Test Tournaments Seed Script
 *
 * Creates 3 small test tournaments for development/testing:
 *  1. Copa América 2025 — 8 teams, 2 groups, semis + final (15 matches)
 *  2. Euro 2028 — 4 teams, 1 group, semis + final (9 matches)
 *  3. Champions League 2026 — 4 teams, semis + final only (3 matches)
 *
 * Usage:
 *   npx tsx src/database/seeds/test-tournaments.seed.ts
 *
 * This script is IDEMPOTENT — running it twice will not create duplicates.
 * Teams are reused from the World Cup seed when they already exist.
 */

import { PrismaClient } from '@prisma/client';
import type { MatchPhase } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFlagUrl(isoCode: string): string {
  return `https://flagcdn.com/w80/${isoCode}.png`;
}

function sched(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
}

interface TeamDef {
  name: string;
  code: string;
  isoCode: string;
}

async function findOrCreateTeam(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  def: TeamDef,
): Promise<string> {
  let team = await tx.team.findFirst({ where: { shortName: def.code } });
  if (!team) {
    team = await tx.team.create({
      data: {
        name: def.name,
        shortName: def.code,
        flagUrl: getFlagUrl(def.isoCode),
        country: def.name,
      },
    });
    console.log(`  🏳️ Created team: ${def.name} (${def.code})`);
  }
  return team.id;
}

// ============================================================================
// 1. COPA AMÉRICA 2025
//    8 teams, 2 groups (A, B) × 4 teams, semis, 3rd place, final
//    Status: IN_PROGRESS (so we can test live/finished matches)
// ============================================================================

async function seedCopaAmerica(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<void> {
  console.log('\n🏆 Seeding Copa América 2025...');

  const slug = 'copa-america-2025';
  let tournament = await tx.tournament.findUnique({ where: { slug } });

  if (tournament) {
    console.log(`✅ Already exists: ${tournament.name}`);
  } else {
    tournament = await tx.tournament.create({
      data: {
        name: 'Copa América 2025',
        slug,
        type: 'COPA_AMERICA',
        description: 'Copa América edition for testing purposes.',
        startDate: new Date('2025-06-20'),
        endDate: new Date('2025-07-14'),
        status: 'IN_PROGRESS',
      },
    });
    console.log(`✅ Created: ${tournament.name}`);
  }

  const tid = tournament.id;

  // Phases: GROUP_STAGE, SEMI_FINAL, THIRD_PLACE, FINAL
  const phases: { phase: MatchPhase; multiplier: number; sortOrder: number }[] = [
    { phase: 'GROUP_STAGE', multiplier: 1, sortOrder: 0 },
    { phase: 'SEMI_FINAL', multiplier: 2, sortOrder: 1 },
    { phase: 'THIRD_PLACE', multiplier: 2, sortOrder: 2 },
    { phase: 'FINAL', multiplier: 3, sortOrder: 3 },
  ];

  for (const p of phases) {
    await tx.tournamentPhase.upsert({
      where: { tournamentId_phase: { tournamentId: tid, phase: p.phase } },
      update: { multiplier: p.multiplier, sortOrder: p.sortOrder },
      create: { tournamentId: tid, ...p },
    });
  }

  // Bonus types
  for (const b of [
    { key: 'champion', label: 'Campeón', points: 10, sortOrder: 0 },
    { key: 'top_scorer', label: 'Goleador', points: 10, sortOrder: 1 },
  ]) {
    await tx.tournamentBonusType.upsert({
      where: { tournamentId_key: { tournamentId: tid, key: b.key } },
      update: { label: b.label, points: b.points, sortOrder: b.sortOrder },
      create: { tournamentId: tid, ...b },
    });
  }

  // Teams — reuse existing ones from WC seed when possible
  const teamDefs: (TeamDef & { group: string })[] = [
    // Group A
    { name: 'Argentina', code: 'ARG', isoCode: 'ar', group: 'A' },
    { name: 'Colombia', code: 'COL', isoCode: 'co', group: 'A' },
    { name: 'Ecuador', code: 'ECU', isoCode: 'ec', group: 'A' },
    { name: 'Paraguay', code: 'PAR', isoCode: 'py', group: 'A' },
    // Group B
    { name: 'Brazil', code: 'BRA', isoCode: 'br', group: 'B' },
    { name: 'Uruguay', code: 'URU', isoCode: 'uy', group: 'B' },
    { name: 'Mexico', code: 'MEX', isoCode: 'mx', group: 'B' },
    { name: 'USA', code: 'USA', isoCode: 'us', group: 'B' },
  ];

  const teamMap = new Map<string, string>();
  for (const def of teamDefs) {
    const id = await findOrCreateTeam(tx, def);
    teamMap.set(def.name, id);
    await tx.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tid, teamId: id } },
      update: { groupLetter: def.group },
      create: { tournamentId: tid, teamId: id, groupLetter: def.group },
    });
  }

  // Delete old matches
  await tx.match.deleteMany({ where: { tournamentId: tid } });

  let mn = 1;

  // Group A matches (6) — some FINISHED, some LIVE, some SCHEDULED
  const groupA = [
    { h: 'Argentina', a: 'Colombia', d: '2025-06-20', t: '22:00', s: 'FINISHED' as const, hs: 2, as: 1 },
    { h: 'Ecuador', a: 'Paraguay', d: '2025-06-20', t: '19:00', s: 'FINISHED' as const, hs: 1, as: 0 },
    { h: 'Argentina', a: 'Ecuador', d: '2025-06-24', t: '22:00', s: 'FINISHED' as const, hs: 3, as: 0 },
    { h: 'Colombia', a: 'Paraguay', d: '2025-06-24', t: '19:00', s: 'LIVE' as const, hs: 1, as: 1 },
    { h: 'Argentina', a: 'Paraguay', d: '2025-06-28', t: '22:00', s: 'SCHEDULED' as const, hs: null, as: null },
    { h: 'Colombia', a: 'Ecuador', d: '2025-06-28', t: '19:00', s: 'SCHEDULED' as const, hs: null, as: null },
  ];

  for (const m of groupA) {
    await tx.match.create({
      data: {
        tournamentId: tid,
        homeTeamId: teamMap.get(m.h)!,
        awayTeamId: teamMap.get(m.a)!,
        phase: 'GROUP_STAGE',
        groupLetter: 'A',
        matchNumber: mn++,
        scheduledAt: sched(m.d, m.t),
        venue: 'Buenos Aires',
        city: 'Buenos Aires',
        status: m.s,
        homeScore: m.hs,
        awayScore: m.as,
      },
    });
  }

  // Group B matches (6) — mix of statuses
  const groupB = [
    { h: 'Brazil', a: 'Uruguay', d: '2025-06-21', t: '22:00', s: 'FINISHED' as const, hs: 0, as: 1 },
    { h: 'Mexico', a: 'USA', d: '2025-06-21', t: '19:00', s: 'FINISHED' as const, hs: 2, as: 2 },
    { h: 'Brazil', a: 'Mexico', d: '2025-06-25', t: '22:00', s: 'LIVE' as const, hs: 2, as: 0 },
    { h: 'Uruguay', a: 'USA', d: '2025-06-25', t: '19:00', s: 'SCHEDULED' as const, hs: null, as: null },
    { h: 'Brazil', a: 'USA', d: '2025-06-29', t: '22:00', s: 'SCHEDULED' as const, hs: null, as: null },
    { h: 'Uruguay', a: 'Mexico', d: '2025-06-29', t: '19:00', s: 'SCHEDULED' as const, hs: null, as: null },
  ];

  for (const m of groupB) {
    await tx.match.create({
      data: {
        tournamentId: tid,
        homeTeamId: teamMap.get(m.h)!,
        awayTeamId: teamMap.get(m.a)!,
        phase: 'GROUP_STAGE',
        groupLetter: 'B',
        matchNumber: mn++,
        scheduledAt: sched(m.d, m.t),
        venue: 'São Paulo',
        city: 'São Paulo',
        status: m.s,
        homeScore: m.hs,
        awayScore: m.as,
      },
    });
  }

  // Semis, 3rd, Final — all SCHEDULED with placeholders
  const knockouts = [
    { phase: 'SEMI_FINAL' as MatchPhase, d: '2025-07-08', t: '22:00', hp: '1° Grupo A', ap: '2° Grupo B' },
    { phase: 'SEMI_FINAL' as MatchPhase, d: '2025-07-09', t: '22:00', hp: '1° Grupo B', ap: '2° Grupo A' },
    { phase: 'THIRD_PLACE' as MatchPhase, d: '2025-07-13', t: '19:00', hp: 'Perdedor Semi 1', ap: 'Perdedor Semi 2' },
    { phase: 'FINAL' as MatchPhase, d: '2025-07-14', t: '22:00', hp: 'Ganador Semi 1', ap: 'Ganador Semi 2' },
  ];

  for (const k of knockouts) {
    await tx.match.create({
      data: {
        tournamentId: tid,
        homeTeamId: null,
        awayTeamId: null,
        phase: k.phase,
        matchNumber: mn++,
        scheduledAt: sched(k.d, k.t),
        venue: 'Buenos Aires',
        city: 'Buenos Aires',
        homeTeamPlaceholder: k.hp,
        awayTeamPlaceholder: k.ap,
      },
    });
  }

  console.log(`✅ Copa América 2025: 8 teams, ${mn - 1} matches (mixed statuses)`);
}

// ============================================================================
// 2. EURO 2028
//    4 teams, 1 group (A), semis, final — small & clean
//    Status: UPCOMING
// ============================================================================

async function seedEuro(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<void> {
  console.log('\n🏆 Seeding Euro 2028...');

  const slug = 'euro-2028';
  let tournament = await tx.tournament.findUnique({ where: { slug } });

  if (tournament) {
    console.log(`✅ Already exists: ${tournament.name}`);
  } else {
    tournament = await tx.tournament.create({
      data: {
        name: 'UEFA Euro 2028',
        slug,
        type: 'EURO',
        description: 'Simplified Euro for testing — 4 teams only.',
        startDate: new Date('2028-06-10'),
        endDate: new Date('2028-07-10'),
        status: 'UPCOMING',
      },
    });
    console.log(`✅ Created: ${tournament.name}`);
  }

  const tid = tournament.id;

  const phases: { phase: MatchPhase; multiplier: number; sortOrder: number }[] = [
    { phase: 'GROUP_STAGE', multiplier: 1, sortOrder: 0 },
    { phase: 'SEMI_FINAL', multiplier: 2, sortOrder: 1 },
    { phase: 'FINAL', multiplier: 3, sortOrder: 2 },
  ];

  for (const p of phases) {
    await tx.tournamentPhase.upsert({
      where: { tournamentId_phase: { tournamentId: tid, phase: p.phase } },
      update: { multiplier: p.multiplier, sortOrder: p.sortOrder },
      create: { tournamentId: tid, ...p },
    });
  }

  const teamDefs: (TeamDef & { group: string })[] = [
    { name: 'Spain', code: 'ESP', isoCode: 'es', group: 'A' },
    { name: 'France', code: 'FRA', isoCode: 'fr', group: 'A' },
    { name: 'Germany', code: 'GER', isoCode: 'de', group: 'A' },
    { name: 'England', code: 'ENG', isoCode: 'gb-eng', group: 'A' },
  ];

  const teamMap = new Map<string, string>();
  for (const def of teamDefs) {
    const id = await findOrCreateTeam(tx, def);
    teamMap.set(def.name, id);
    await tx.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tid, teamId: id } },
      update: { groupLetter: def.group },
      create: { tournamentId: tid, teamId: id, groupLetter: def.group },
    });
  }

  await tx.match.deleteMany({ where: { tournamentId: tid } });

  let mn = 1;

  // Group A: 6 matches, all SCHEDULED (future tournament)
  const groupMatches = [
    { h: 'Spain', a: 'France', d: '2028-06-10', t: '21:00' },
    { h: 'Germany', a: 'England', d: '2028-06-10', t: '18:00' },
    { h: 'Spain', a: 'Germany', d: '2028-06-14', t: '21:00' },
    { h: 'France', a: 'England', d: '2028-06-14', t: '18:00' },
    { h: 'Spain', a: 'England', d: '2028-06-18', t: '21:00' },
    { h: 'France', a: 'Germany', d: '2028-06-18', t: '18:00' },
  ];

  for (const m of groupMatches) {
    await tx.match.create({
      data: {
        tournamentId: tid,
        homeTeamId: teamMap.get(m.h)!,
        awayTeamId: teamMap.get(m.a)!,
        phase: 'GROUP_STAGE',
        groupLetter: 'A',
        matchNumber: mn++,
        scheduledAt: sched(m.d, m.t),
        venue: 'London',
        city: 'London',
      },
    });
  }

  // Semis + Final
  const knockouts = [
    { phase: 'SEMI_FINAL' as MatchPhase, d: '2028-07-04', t: '21:00', hp: '1st Group A', ap: '4th Group A' },
    { phase: 'SEMI_FINAL' as MatchPhase, d: '2028-07-05', t: '21:00', hp: '2nd Group A', ap: '3rd Group A' },
    { phase: 'FINAL' as MatchPhase, d: '2028-07-10', t: '21:00', hp: 'Winner Semi 1', ap: 'Winner Semi 2' },
  ];

  for (const k of knockouts) {
    await tx.match.create({
      data: {
        tournamentId: tid,
        homeTeamId: null,
        awayTeamId: null,
        phase: k.phase,
        matchNumber: mn++,
        scheduledAt: sched(k.d, k.t),
        venue: 'London',
        city: 'London',
        homeTeamPlaceholder: k.hp,
        awayTeamPlaceholder: k.ap,
      },
    });
  }

  console.log(`✅ Euro 2028: 4 teams, ${mn - 1} matches (all SCHEDULED)`);
}

// ============================================================================
// 3. CHAMPIONS LEAGUE 2026
//    4 teams (clubs), SEMI_FINAL + FINAL only — minimal tournament
//    Status: UPCOMING
// ============================================================================

async function seedChampions(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<void> {
  console.log('\n🏆 Seeding Champions League 2026...');

  const slug = 'champions-league-2026';
  let tournament = await tx.tournament.findUnique({ where: { slug } });

  if (tournament) {
    console.log(`✅ Already exists: ${tournament.name}`);
  } else {
    tournament = await tx.tournament.create({
      data: {
        name: 'UEFA Champions League 2025/26',
        slug,
        type: 'CHAMPIONS_LEAGUE',
        description: 'Simplified Champions League for testing — semi-finals and final only.',
        startDate: new Date('2026-04-28'),
        endDate: new Date('2026-05-30'),
        status: 'UPCOMING',
      },
    });
    console.log(`✅ Created: ${tournament.name}`);
  }

  const tid = tournament.id;

  const phases: { phase: MatchPhase; multiplier: number; sortOrder: number }[] = [
    { phase: 'SEMI_FINAL', multiplier: 2, sortOrder: 0 },
    { phase: 'FINAL', multiplier: 3, sortOrder: 1 },
  ];

  for (const p of phases) {
    await tx.tournamentPhase.upsert({
      where: { tournamentId_phase: { tournamentId: tid, phase: p.phase } },
      update: { multiplier: p.multiplier, sortOrder: p.sortOrder },
      create: { tournamentId: tid, ...p },
    });
  }

  // Club teams (not national teams — different entities)
  const clubDefs: TeamDef[] = [
    { name: 'Real Madrid', code: 'RMA', isoCode: 'es' },
    { name: 'FC Barcelona', code: 'FCB', isoCode: 'es' },
    { name: 'Manchester City', code: 'MCI', isoCode: 'gb-eng' },
    { name: 'Bayern Munich', code: 'FCB-M', isoCode: 'de' },
  ];

  const teamMap = new Map<string, string>();
  for (const def of clubDefs) {
    const id = await findOrCreateTeam(tx, def);
    teamMap.set(def.name, id);
    await tx.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tid, teamId: id } },
      update: {},
      create: { tournamentId: tid, teamId: id },
    });
  }

  await tx.match.deleteMany({ where: { tournamentId: tid } });

  // Semi-final 1: Real Madrid vs Manchester City
  await tx.match.create({
    data: {
      tournamentId: tid,
      homeTeamId: teamMap.get('Real Madrid')!,
      awayTeamId: teamMap.get('Manchester City')!,
      phase: 'SEMI_FINAL',
      matchNumber: 1,
      scheduledAt: sched('2026-04-28', '21:00'),
      venue: 'Santiago Bernabéu',
      city: 'Madrid',
    },
  });

  // Semi-final 2: FC Barcelona vs Bayern Munich
  await tx.match.create({
    data: {
      tournamentId: tid,
      homeTeamId: teamMap.get('FC Barcelona')!,
      awayTeamId: teamMap.get('Bayern Munich')!,
      phase: 'SEMI_FINAL',
      matchNumber: 2,
      scheduledAt: sched('2026-04-29', '21:00'),
      venue: 'Camp Nou',
      city: 'Barcelona',
    },
  });

  // Final: placeholders
  await tx.match.create({
    data: {
      tournamentId: tid,
      homeTeamId: null,
      awayTeamId: null,
      phase: 'FINAL',
      matchNumber: 3,
      scheduledAt: sched('2026-05-30', '21:00'),
      venue: 'Allianz Arena',
      city: 'Munich',
      homeTeamPlaceholder: 'Winner Semi 1',
      awayTeamPlaceholder: 'Winner Semi 2',
    },
  });

  console.log(`✅ Champions League 2026: 4 teams, 3 matches (all SCHEDULED)`);
}

// ============================================================================
// Main
// ============================================================================

async function seed(): Promise<void> {
  console.log('🧪 Starting test tournaments seed...\n');

  await prisma.$transaction(async (tx) => {
    await seedCopaAmerica(tx);
    await seedEuro(tx);
    await seedChampions(tx);
  });

  console.log('\n🎉 Test tournaments seed completed!');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
