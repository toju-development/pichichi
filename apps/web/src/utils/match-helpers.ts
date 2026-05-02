/**
 * Utility helpers for organising and displaying match data.
 *
 * Port literal de `apps/mobile/src/utils/match-helpers.ts` — vanilla JS sin
 * dependencias de React Native. Centraliza formato de fechas en español,
 * labels de phase/tournament, y la lógica de "group-by-date" usada por
 * listas con secciones.
 */

import type { MatchDto } from "@pichichi/shared";
import { LOCK_BUFFER_MINUTES } from "@pichichi/shared";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A section of matches grouped by date, ready for sectioned rendering. */
export interface MatchSection {
  /** Display title: "Miércoles 11 de Junio" */
  title: string;
  /** ISO date string key for uniqueness: "2026-06-11" */
  dateKey: string;
  /** Matches for this date, in chronological order. */
  data: MatchDto[];
}

// ─── Spanish day / month names ──────────────────────────────────────────────

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const MONTH_ABBR = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

// ─── Label dictionaries ─────────────────────────────────────────────────────

/** Human-readable phase labels in Spanish. */
export const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_OF_32: "32avos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINAL: "Cuartos",
  SEMI_FINAL: "Semifinal",
  THIRD_PLACE: "3er Puesto",
  FINAL: "Final",
};

/** Human-readable tournament type labels in Spanish. */
export const TOURNAMENT_TYPE_LABELS: Record<string, string> = {
  WORLD_CUP: "Copa del Mundo",
  COPA_AMERICA: "Copa América",
  EURO: "Eurocopa",
  CHAMPIONS_LEAGUE: "Champions League",
  COPA_LIBERTADORES: "Copa Libertadores",
  CUSTOM: "Personalizado",
};

/** Human-readable tournament status labels in Spanish. */
export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  UPCOMING: "Próximamente",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

// ─── Lock Logic ─────────────────────────────────────────────────────────────

/**
 * Determines whether a match is locked for prediction entry.
 *
 * A match is locked when:
 * 1. Its status is anything other than SCHEDULED, OR
 * 2. It's within LOCK_BUFFER_MINUTES (5 min) of kickoff.
 *
 * Shared by PredictionMatchCard (gate) and ScorePredictionModal (safety re-check).
 */
export function isMatchLocked(match: MatchDto): boolean {
  if (match.status !== "SCHEDULED") return true;

  const kickoffMs = new Date(match.scheduledAt).getTime();
  const bufferMs = LOCK_BUFFER_MINUTES * 60_000;

  return Date.now() > kickoffMs - bufferMs;
}

/**
 * Determines if BONUS predictions should be locked for a tournament.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx:117`
 * (`areBonusesLocked`). Bonus predictions se bloquean cuando el PRIMER partido
 * del torneo (el más temprano por `scheduledAt`) ya empezó:
 *   - su status dejó de ser SCHEDULED, O
 *   - `Date.now() > scheduledAt`.
 *
 * Importante: NO comparte la lógica de `isMatchLocked` (que tiene un buffer de
 * 5 minutos pre-kickoff). Para bonus el corte es exactamente el kickoff del
 * primer partido — no antes.
 */
export function areBonusesLocked(matches: MatchDto[]): boolean {
  if (matches.length === 0) return false;

  // Find earliest match by scheduledAt.
  const earliest = matches.reduce((min, m) =>
    new Date(m.scheduledAt).getTime() < new Date(min.scheduledAt).getTime()
      ? m
      : min,
  );

  return (
    earliest.status !== "SCHEDULED" ||
    Date.now() > new Date(earliest.scheduledAt).getTime()
  );
}

// ─── Match status filtering ─────────────────────────────────────────────────

/**
 * Matches that can still be predicted: SCHEDULED and not within the lock buffer.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx:134`.
 */
export function getPredictableMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === "SCHEDULED" && !isMatchLocked(m));
}

/**
 * SCHEDULED matches that are within the lock buffer (kickoff inminente).
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx:139`.
 */
export function getLockedScheduledMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === "SCHEDULED" && isMatchLocked(m));
}

/**
 * Live matches — shown locked at the top of the Pronósticos tab.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx:144`.
 */
export function getLiveMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === "LIVE");
}

/**
 * Finished matches — for the Resultados tab.
 *
 * Port literal de `apps/mobile/app/(tabs)/groups/tournament/[slug].tsx:149`.
 */
export function getFinishedMatches(matches: MatchDto[]): MatchDto[] {
  return matches.filter((m) => m.status === "FINISHED");
}

// ─── Date formatting helpers ────────────────────────────────────────────────

/**
 * Formats an ISO date string into a compact match-card format.
 *
 * @example
 * formatMatchDateTime("2026-06-11T16:00:00Z");
 * // → "Mié 11 Jun · 16:00"  (in local timezone)
 */
export function formatMatchDateTime(iso: string): string {
  const d = new Date(iso);
  const day = DAY_ABBR[d.getDay()];
  const date = d.getDate();
  const month = MONTH_ABBR[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${date} ${month} \u00B7 ${hours}:${minutes}`;
}

/**
 * Formats a date range from two ISO strings.
 *
 * @example
 * formatDateRange("2026-06-11T00:00:00Z", "2026-07-19T00:00:00Z");
 * // → "11 Jun - 19 Jul 2026"
 */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);

  const sDay = s.getDate();
  const sMonth = MONTH_ABBR[s.getMonth()];
  const eDay = e.getDate();
  const eMonth = MONTH_ABBR[e.getMonth()];
  const eYear = e.getFullYear();

  return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${eYear}`;
}

/**
 * Formats an ISO date as a full Spanish section title.
 *
 * @example
 * formatSectionDate("2026-06-11T16:00:00Z");
 * // → "Miércoles 11 de Junio"
 */
export function formatSectionDate(iso: string): string {
  const d = new Date(iso);
  const dayName = DAY_NAMES[d.getDay()];
  const date = d.getDate();
  const monthName = MONTH_NAMES[d.getMonth()];
  return `${dayName} ${date} de ${monthName}`;
}

// ─── Grouping ───────────────────────────────────────────────────────────────

/**
 * Groups matches by `scheduledAt` date (local timezone), reverse-chronological.
 * Used for finished/results screens.
 */
export function groupMatchesByDateDesc(matches: MatchDto[]): MatchSection[] {
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  const sectionMap = new Map<string, MatchSection>();

  for (const match of sorted) {
    const d = new Date(match.scheduledAt);
    const dateKey = d.toLocaleDateString("en-CA");

    let section = sectionMap.get(dateKey);

    if (!section) {
      section = {
        title: formatSectionDate(match.scheduledAt),
        dateKey,
        data: [],
      };
      sectionMap.set(dateKey, section);
    }

    section.data.push(match);
  }

  return Array.from(sectionMap.values());
}

/**
 * Groups matches by `scheduledAt` date (local timezone), chronological.
 * Used for upcoming/scheduled screens.
 */
export function groupMatchesByDate(matches: MatchDto[]): MatchSection[] {
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const sectionMap = new Map<string, MatchSection>();

  for (const match of sorted) {
    const d = new Date(match.scheduledAt);
    const dateKey = d.toLocaleDateString("en-CA");

    let section = sectionMap.get(dateKey);

    if (!section) {
      section = {
        title: formatSectionDate(match.scheduledAt),
        dateKey,
        data: [],
      };
      sectionMap.set(dateKey, section);
    }

    section.data.push(match);
  }

  return Array.from(sectionMap.values());
}
