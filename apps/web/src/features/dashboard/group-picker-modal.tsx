"use client";

/**
 * GroupPickerModal — bottom sheet para elegir grupo cuando un partido del
 * dashboard aparece en 2+ grupos del usuario.
 *
 * Port literal de `apps/mobile/src/components/home/TodayMatchesSection.tsx`
 * (función `GroupPickerModal`, líneas 249-302). Mobile usa `<Modal
 * animationType="slide">` con overlay de abajo. Web usa `useDialogA11y`:
 *   - createPortal al body
 *   - backdrop button para cerrar
 *   - ESC para cerrar
 *   - body scroll bloqueado
 *   - role="dialog" + aria-modal + aria-labelledby
 *   - focus trap circular
 *   - focus restoration al cerrar
 *   - focus inicial sobre la primera fila clickable
 *
 * Se renderiza como sheet anclado abajo (`mt-auto` + `rounded-t-2xl`) en
 * mobile, y como dialog centrado en sm+ (paridad con ScorePredictionModal).
 *
 * El handle bar visual (línea gris pequeña centrada) replica la affordance
 * de mobile.
 */

import { createPortal } from "react-dom";

import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { cn } from "@/lib/cn";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Per-group entry shown in the picker list. Mirrors `GroupEntry` del archivo
 * mobile — exportado acá para que `today-matches-section.tsx` reuse el tipo.
 */
export interface GroupPickerEntry {
  groupId: string;
  groupName: string;
  tournamentSlug: string;
  hasPrediction: boolean;
  predictedHome: number | null;
  predictedAway: number | null;
}

interface GroupPickerModalProps {
  visible: boolean;
  groups: GroupPickerEntry[];
  onSelect: (group: GroupPickerEntry) => void;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GroupPickerModal({
  visible,
  groups,
  onSelect,
  onClose,
}: GroupPickerModalProps) {
  const titleId = "group-picker-modal-title";

  // a11y: ESC + body scroll lock + focus trap + focus restoration.
  // Focus inicial = primer focusable del panel (la primera fila clickable).
  const { dialogRef } = useDialogA11y({
    open: visible,
    onClose,
  });

  if (!visible) return null;
  if (typeof window === "undefined") return null;

  const node = (
    <div
      data-testid="group-picker-modal"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        data-testid="group-picker-modal-backdrop"
        className="absolute inset-0 bg-black/40"
      />

      {/* Sheet panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-md flex-col rounded-t-2xl bg-white px-5 pb-9 shadow-lg sm:rounded-2xl"
      >
        {/* Handle bar (visual affordance mobile) */}
        <div className="flex items-center justify-center pb-2 pt-2.5">
          <span
            aria-hidden
            className="h-1 w-9 rounded-full bg-[#D1D5DB]"
          />
        </div>

        <h2
          id={titleId}
          className="mb-4 text-base font-bold text-text-primary"
        >
          ¿En qué grupo querés pronosticar?
        </h2>

        {groups.map((g, idx) => (
          <button
            key={g.groupId}
            type="button"
            data-testid={`group-picker-row-${g.groupId}`}
            onClick={() => {
              onClose();
              onSelect(g);
            }}
            className={cn(
              "flex items-center justify-between py-3.5 text-left transition hover:opacity-80",
              idx < groups.length - 1 && "border-b border-[#E5E7EB]",
            )}
          >
            <span className="flex items-center gap-2.5">
              <UsersGlyph />
              <span className="text-[15px] font-semibold text-text-primary">
                {g.groupName}
              </span>
            </span>
            {g.hasPrediction ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                <CheckGlyph />
                {g.predictedHome}-{g.predictedAway}
              </span>
            ) : (
              <ChevronRightGlyph />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

// ─── Inline glyphs (no lucide-react dep) ────────────────────────────────────

function UsersGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5L6.5 12L13 5" />
    </svg>
  );
}

function ChevronRightGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
