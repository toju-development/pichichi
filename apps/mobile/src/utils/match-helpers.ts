/**
 * Utility helpers for organising and displaying match data.
 *
 * Centralises Spanish date formatting, phase/tournament labels, and the
 * "group-by-date" logic used by tournament SectionLists.  All date
 * formatting is done with vanilla JS — no external i18n libraries.
 */

import type { MatchDto } from '@pichichi/shared';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A section of matches grouped by date, ready for SectionList rendering. */
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
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const DAY_ABBR = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
] as const;

const MONTH_ABBR = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

// ─── Label dictionaries ─────────────────────────────────────────────────────

/** Human-readable phase labels in Spanish. */
export const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_32: '32avos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinal',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
};

/** Human-readable tournament type labels in Spanish. */
export const TOURNAMENT_TYPE_LABELS: Record<string, string> = {
  WORLD_CUP: 'Copa del Mundo',
  COPA_AMERICA: 'Copa América',
  EURO: 'Eurocopa',
  CHAMPIONS_LEAGUE: 'Champions League',
  CUSTOM: 'Personalizado',
};

/** Human-readable tournament status labels in Spanish. */
export const TOURNAMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  UPCOMING: 'Próximamente',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

// ─── Date formatting helpers ────────────────────────────────────────────────

/**
 * Formats an ISO date string into a compact match-card format.
 *
 * @example
 * formatMatchDateTime('2026-06-11T16:00:00Z');
 * // → "Mié 11 Jun · 16:00"  (in local timezone)
 */
export function formatMatchDateTime(iso: string): string {
  const d = new Date(iso);
  const day = DAY_ABBR[d.getDay()];
  const date = d.getDate();
  const month = MONTH_ABBR[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${date} ${month} \u00B7 ${hours}:${minutes}`;
}

/**
 * Formats a date range from two ISO strings.
 *
 * @example
 * formatDateRange('2026-06-11T00:00:00Z', '2026-07-19T00:00:00Z');
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
 * formatSectionDate('2026-06-11T16:00:00Z');
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
 * Groups an array of matches by their `scheduledAt` date (local timezone)
 * and returns sections sorted chronologically, ready for `SectionList`.
 *
 * - Matches are first sorted by `scheduledAt` ascending.
 * - Each section's `dateKey` is an ISO date string ("2026-06-11").
 * - Each section's `title` is a human-readable Spanish label.
 * - Within each section, `data` preserves the chronological order.
 *
 * @example
 * const sections = groupMatchesByDate(matches);
 * // [
 * //   { title: "Miércoles 11 de Junio", dateKey: "2026-06-11", data: [...] },
 * //   { title: "Jueves 12 de Junio",    dateKey: "2026-06-12", data: [...] },
 * // ]
 */
export function groupMatchesByDate(matches: MatchDto[]): MatchSection[] {
  // 1. Sort by scheduledAt ascending
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  // 2. Group by calendar date (local timezone)
  const sectionMap = new Map<string, MatchSection>();

  for (const match of sorted) {
    const d = new Date(match.scheduledAt);
    // en-CA locale gives "YYYY-MM-DD" format
    const dateKey = d.toLocaleDateString('en-CA');

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

  // 3. Map values preserve insertion order, which is already chronological
  return Array.from(sectionMap.values());
}
