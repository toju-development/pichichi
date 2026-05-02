"use client";

/**
 * useDialogA11y — encapsula el patrón a11y compartido por todos los modals
 * de la app web (ScorePredictionModal, GroupPickerModal, futuros).
 *
 * Lo que provee:
 *   - `mounted` flag para evitar renders SSR (usar `if (!mounted) return null`).
 *   - `dialogRef` para colgar al panel `role="dialog"`.
 *   - ESC key → llama `onClose`.
 *   - Body scroll lock mientras el modal está abierto.
 *   - Focus trap circular (Tab / Shift+Tab) entre todos los focusables del panel.
 *   - Focus restoration al elemento que abrió el modal.
 *   - Focus inicial:
 *       1) si se pasa `initialFocusRef.current`, ese,
 *       2) si se pasa `initialFocusSelector` (relativo al dialogRef), ese,
 *       3) en último caso, el primer focusable del panel.
 *
 * Cleanup orden estricto en este orden (mismo que mobile):
 *   1) restore overflow
 *   2) remove keydown listener
 *   3) restore focus al trigger
 *
 * Decisión: NO se hace `createPortal` ni `ssr-guard` adentro del hook —
 * el componente sigue siendo dueño del JSX del backdrop + panel. El hook
 * solo provee el comportamiento. Esto deja a los consumers libres de
 * estructurar el sheet/dialog como quieran (slide-up, centrado, fullscreen)
 * sin que el hook les imponga layout.
 *
 * Port consolidado del patrón duplicado en:
 *   - apps/web/src/features/predictions/score-prediction-modal.tsx
 *   - apps/web/src/features/dashboard/group-picker-modal.tsx
 */

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

// Selector matches all natively-focusable elements that we want inside the trap.
// Excludes elements explicitly opted-out via tabindex="-1".
export const FOCUSABLE_SELECTOR =
  'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

interface UseDialogA11yOptions {
  open: boolean;
  onClose: () => void;
  /** Ref opcional al elemento que debe recibir el focus inicial. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Selector CSS opcional, relativo al `dialogRef`, para focus inicial.
   * Se usa solo si `initialFocusRef` no está presente o no resuelve.
   */
  initialFocusSelector?: string;
}

interface UseDialogA11yResult {
  /** Conectar al panel `role="dialog"`. */
  dialogRef: RefObject<HTMLDivElement | null>;
}

export function useDialogA11y(
  options: UseDialogA11yOptions,
): UseDialogA11yResult {
  const { open, onClose, initialFocusRef, initialFocusSelector } = options;

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Captura el elemento focuseado al abrir para restaurar al cerrar.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function getFocusables(): HTMLElement[] {
      const root = dialogRef.current;
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Focus trap circular: ciclar entre el primer y último focusable del panel.
      const focusables = getFocusables();
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      // Si el focus está fuera del modal, traerlo de vuelta al primero.
      if (!active || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Focus inicial:
    //  1) initialFocusRef.current si existe
    //  2) initialFocusSelector dentro del dialogRef si existe
    //  3) primer focusable del panel
    const focusables = getFocusables();
    let initialTarget: HTMLElement | null | undefined =
      initialFocusRef?.current ?? null;
    if (!initialTarget && initialFocusSelector) {
      initialTarget =
        dialogRef.current?.querySelector<HTMLElement>(initialFocusSelector) ??
        null;
    }
    if (!initialTarget) {
      initialTarget = focusables[0] ?? null;
    }
    initialTarget?.focus();

    return () => {
      // Cleanup orden estricto:
      //   1) restore overflow,
      //   2) remove listener,
      //   3) focus restoration al trigger original.
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
    // `onClose` viene del parent — depender solo de `open` es el contrato.
    // initialFocusRef / initialFocusSelector se leen una sola vez al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { dialogRef };
}
