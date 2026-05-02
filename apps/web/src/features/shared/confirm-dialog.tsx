"use client";

/**
 * ConfirmDialog — modal de confirmación accesible, custom (sin Radix/shadcn).
 *
 * Pichichi es PWA con stack mínimo (no librería de modales). Este primitive
 * cubre el 90% de los casos: confirmar/cancelar acciones destructivas o
 * irreversibles. Reemplaza al `window.confirm()` del navegador, que rompe el
 * design system y no soporta theming.
 *
 * Accesibilidad mínima:
 *   - role="dialog" + aria-modal="true"
 *   - aria-labelledby al título
 *   - foco al botón de confirmar al abrir
 *   - ESC y click en backdrop cierran
 *   - body scroll bloqueado mientras está abierto
 *
 * NOTA(focus-trap): no implementamos focus-trap completo (Tab cycle dentro
 * del modal). Para los usos actuales (2 botones) es aceptable. Si más
 * adelante el dialog gana inputs/links, hay que agregar trap manual.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  /** Stable selector for E2E. */
  testId?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  testId = "confirm-dialog",
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `${testId}-title`;

  // ESC para cerrar + lock body scroll mientras abierto.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Focus inicial al confirmar (post-paint, así react ya montó el botón).
  useEffect(() => {
    if (!open) return;
    confirmButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;
  if (typeof window === "undefined") return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-danger text-text-on-primary hover:opacity-90"
      : "bg-primary text-text-on-primary hover:bg-primary-dark";

  const node = (
    <div
      data-testid={testId}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        data-testid={`${testId}-backdrop`}
        className="absolute inset-0 bg-black/50"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 mx-4 w-full max-w-md rounded-lg bg-surface p-6 shadow-lg",
          "flex flex-col gap-4",
        )}
      >
        <h2
          id={titleId}
          className="text-base font-semibold text-text-primary"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-text-secondary">{description}</p>
        ) : null}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            data-testid={`${testId}-cancel`}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-primary-surface-light"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            data-testid={`${testId}-confirm`}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition",
              confirmClasses,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
