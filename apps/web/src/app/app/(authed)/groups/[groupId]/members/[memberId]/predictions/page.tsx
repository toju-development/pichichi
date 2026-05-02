"use client";

/**
 * Member predictions page — `/app/groups/[groupId]/members/[memberId]/predictions`.
 *
 * Web-equivalent (Phase 5B.7-C) de
 * `apps/mobile/app/(tabs)/groups/member-predictions.tsx` (455 lines).
 *
 * Muestra el historial de pronósticos de un miembro DENTRO de un grupo,
 * agrupado por torneo. Estados literal mobile:
 *   - loading: spinner + "Cargando predicciones..."
 *   - empty (sin data o predictions vacías): "Sin predicciones" +
 *     "Este miembro aún no tiene predicciones en partidos finalizados o
 *     en vivo."
 *   - loaded: header con avatar (initial o imagen) + displayName +
 *     totalPoints, seguido de secciones por torneo (logo + nombre) y filas
 *     `PredictionRow` con teams + score + badge.
 *
 * URL contract:
 *   - `params`: `{ groupId, memberId }` (Next 16 → Promise → `use(params)`).
 *   - `searchParams`: `?displayName=...` (opcional, prefilling header
 *     antes que `useMemberPredictions` resuelva). Mobile pasa `displayName`
 *     como `useLocalSearchParams` query — web preserva la misma UX vía
 *     `useSearchParams()`.
 *
 * Ref Next 16 docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
 *   - client components reciben `params` como Promise → `use(params)`.
 *   - `searchParams` se accede sync vía `useSearchParams()` cuando el
 *     componente es client (paridad con el resto de páginas web).
 *
 * Tokens web (vs mobile RGB literal):
 *   - success / success-soft, primary / primary-surface, warning /
 *     warning-surface, text-text-tertiary / surface-muted (NO existen
 *     `text-muted` ni `success-surface` en globals.css — bug ya cazado en
 *     5B.7-B).
 *
 * React Compiler ON: NO `useMemo`/`useCallback`. El group + sort se hace
 * inline en el render — el compiler memoiza.
 */

import Link from "next/link";
import { use } from "react";
import { useSearchParams } from "next/navigation";

import type {
  MemberPredictionItemDto,
  PredictionPointType,
} from "@pichichi/shared";

import { useMemberPredictions } from "@/hooks/use-predictions";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";

interface MemberPredictionsPageProps {
  params: Promise<{ groupId: string; memberId: string }>;
}

// ─── Point-type display config (mismo que group-predictions-sheet) ─────────

interface PointTypeConfig {
  label: string;
  textClass: string;
  bgClass: string;
}

const POINT_TYPE_CONFIG: Record<PredictionPointType, PointTypeConfig> = {
  EXACT: {
    label: "Exacto",
    textClass: "text-success",
    bgClass: "bg-success-soft",
  },
  GOAL_DIFF: {
    label: "Gol Dif",
    textClass: "text-primary",
    bgClass: "bg-primary-surface",
  },
  WINNER: {
    label: "Ganador",
    textClass: "text-warning",
    bgClass: "bg-warning-surface",
  },
  MISS: {
    label: "Errado",
    textClass: "text-text-tertiary",
    bgClass: "bg-surface-muted",
  },
};

// ─── Types & helpers ───────────────────────────────────────────────────────

interface TournamentSection {
  tournamentId: string;
  tournamentName: string;
  tournamentLogoUrl: string | null;
  data: MemberPredictionItemDto[];
}

function groupByTournament(
  predictions: MemberPredictionItemDto[],
): TournamentSection[] {
  const map = new Map<string, TournamentSection>();
  for (const p of predictions) {
    let section = map.get(p.tournamentId);
    if (!section) {
      section = {
        tournamentId: p.tournamentId,
        tournamentName: p.tournamentName,
        tournamentLogoUrl: p.tournamentLogoUrl,
        data: [],
      };
      map.set(p.tournamentId, section);
    }
    section.data.push(p);
  }
  return Array.from(map.values());
}

// ─── Sub-components ────────────────────────────────────────────────────────

function PredictionRow({ item }: { item: MemberPredictionItemDto }) {
  const pointConfig = item.pointType ? POINT_TYPE_CONFIG[item.pointType] : null;
  const isFinished = item.match.status === "FINISHED";
  const isLive = item.match.status === "LIVE";

  return (
    <li
      data-testid={`member-prediction-${item.id}`}
      className={cn(
        "mx-5 mt-2 flex flex-col gap-2 rounded-xl border bg-white px-3.5 py-3",
        isLive ? "border-success border-[1.5px]" : "border-border",
      )}
    >
      {/* LIVE indicator */}
      {isLive ? (
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-success"
          />
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-success">
            EN VIVO
          </span>
        </div>
      ) : null}

      {/* Teams + Scores */}
      <div className="flex items-center justify-between">
        {/* Home team */}
        <div className="flex flex-1 items-center gap-1.5">
          {item.match.homeTeamFlagUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.match.homeTeamFlagUrl}
              alt=""
              className="h-[22px] w-[22px] rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="h-[22px] w-[22px] rounded-full bg-primary-surface-light"
            />
          )}
          <span className="truncate text-[13px] font-semibold text-text-primary">
            {item.match.homeTeamShortName ?? item.match.homeTeamName ?? "?"}
          </span>
        </div>

        {/* Actual score */}
        <div className="rounded-md bg-primary-surface-light px-2 py-0.5">
          <span className="text-sm font-extrabold tracking-wide text-primary">
            {item.match.homeScore ?? "-"} - {item.match.awayScore ?? "-"}
          </span>
        </div>

        {/* Away team */}
        <div className="flex flex-1 flex-row-reverse items-center gap-1.5">
          {item.match.awayTeamFlagUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.match.awayTeamFlagUrl}
              alt=""
              className="h-[22px] w-[22px] rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="h-[22px] w-[22px] rounded-full bg-primary-surface-light"
            />
          )}
          <span className="truncate text-[13px] font-semibold text-text-primary">
            {item.match.awayTeamShortName ?? item.match.awayTeamName ?? "?"}
          </span>
        </div>
      </div>

      {/* User prediction + Points badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-tertiary">Pronóstico:</span>
        <span className="text-sm font-bold text-text-primary">
          {item.predictedHome} - {item.predictedAway}
        </span>

        {isLive ? (
          <span className="ml-auto flex items-center gap-1 rounded-md bg-success-soft px-2 py-[3px]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[11px] font-semibold tracking-wide text-success">
              En vivo
            </span>
          </span>
        ) : isFinished && pointConfig ? (
          <span
            className={cn(
              "ml-auto flex items-center gap-1 rounded-md px-2 py-[3px]",
              pointConfig.bgClass,
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold tracking-wide",
                pointConfig.textClass,
              )}
            >
              {pointConfig.label}
            </span>
            <span
              className={cn(
                "text-[11px] font-extrabold tracking-wide",
                pointConfig.textClass,
              )}
            >
              +{item.pointsEarned}
            </span>
          </span>
        ) : isFinished ? (
          <span className="ml-auto flex items-center rounded-md bg-surface-muted px-2 py-[3px]">
            <span className="text-[11px] font-semibold text-text-tertiary">
              —
            </span>
          </span>
        ) : null}
      </div>
    </li>
  );
}

function SectionHeader({ section }: { section: TournamentSection }) {
  return (
    <div
      data-testid={`member-prediction-section-${section.tournamentId}`}
      className="flex items-center gap-2 px-5 pb-2 pt-5"
    >
      {section.tournamentLogoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={section.tournamentLogoUrl}
          alt=""
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : null}
      <span className="text-base font-bold text-text-primary">
        {section.tournamentName}
      </span>
    </div>
  );
}

function SpinnerGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8 animate-spin text-primary"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="3"
        stroke="currentColor"
        opacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        strokeWidth="3"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MemberPredictionsPage({
  params,
}: MemberPredictionsPageProps) {
  const { groupId, memberId } = use(params);
  const searchParams = useSearchParams();
  const displayNameQuery = searchParams.get("displayName") ?? undefined;

  const { data, isLoading } = useMemberPredictions(groupId, memberId);

  const sections = data ? groupByTournament(data.predictions) : [];
  const headerName = displayNameQuery ?? data?.displayName ?? "Predicciones";
  const initial = (data?.displayName ?? headerName ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <section
      data-testid="page-member-predictions"
      className="flex flex-col gap-0"
    >
      {/* Back link (mobile usa ScreenHeader gradient + onBack) */}
      <header className="flex flex-col gap-2 px-5 pb-3 pt-1">
        <Link
          href={ROUTES.app.groupDetail(groupId)}
          data-testid="page-member-predictions-back"
          className="self-start text-xs font-semibold text-primary hover:underline"
        >
          ← Volver al grupo
        </Link>
        <h1
          data-testid="page-member-predictions-title"
          className="text-2xl font-extrabold text-text-primary"
        >
          {headerName}
        </h1>
      </header>

      {isLoading ? (
        <div
          data-testid="page-member-predictions-loading"
          className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16"
        >
          <SpinnerGlyph />
          <p className="text-sm text-text-tertiary">
            Cargando predicciones...
          </p>
        </div>
      ) : !data || data.predictions.length === 0 ? (
        <div
          data-testid="page-member-predictions-empty"
          className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16"
        >
          <p className="text-center text-lg font-bold text-text-primary">
            Sin predicciones
          </p>
          <p className="max-w-[280px] text-center text-sm text-text-secondary">
            Este miembro aún no tiene predicciones en partidos finalizados o
            en vivo.
          </p>
        </div>
      ) : (
        <>
          {/* Points header (avatar + name + total) */}
          <div
            data-testid="page-member-predictions-summary"
            className="flex items-center gap-3.5 border-b border-border bg-surface px-5 py-4"
          >
            <span
              aria-hidden
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-text-on-primary"
            >
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.avatarUrl}
                  alt=""
                  className="absolute inset-0 h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-extrabold">{initial}</span>
              )}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span
                data-testid="page-member-predictions-summary-name"
                className="text-base font-bold text-text-primary"
              >
                {data.displayName}
              </span>
              <span
                data-testid="page-member-predictions-summary-total"
                className="text-[22px] font-extrabold text-primary"
              >
                {data.totalPoints} pts
              </span>
            </div>
          </div>

          {/* Sections */}
          <div
            data-testid="page-member-predictions-list"
            className="flex flex-col gap-0 pb-8"
          >
            {sections.map((section) => (
              <div key={section.tournamentId}>
                <SectionHeader section={section} />
                <ul className="flex flex-col gap-0">
                  {section.data.map((item) => (
                    <PredictionRow key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
