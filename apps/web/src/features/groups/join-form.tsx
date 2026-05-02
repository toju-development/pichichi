"use client";

/**
 * JoinForm — formulario para unirse a un grupo via invite code.
 *
 * Port literal de `apps/mobile/src/components/groups/join-group-modal.tsx`:
 *   - Input se uppercaseá y se le quita whitespace en cada cambio
 *     (`text.toUpperCase().replace(/\s/g, '')`).
 *   - maxLength 8.
 *   - Mensajes de error literales.
 *
 * Validación manual con `if` (NO Zod — decisión `web-app-funcional/forms-validation`).
 */
import { useState } from "react";

import { cn } from "@/lib/cn";

interface JoinFormProps {
  /** External submit error (e.g. server-side message). */
  submitError?: string | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (inviteCode: string) => void;
}

const CODE_MAX = 8;

export function JoinForm({
  submitError,
  isSubmitting,
  onCancel,
  onSubmit,
}: JoinFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Mirror mobile: uppercase + strip whitespace as the user types.
    const next = event.target.value.toUpperCase().replace(/\s/g, "");
    setInviteCode(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setLocalError("Ingresá el código de invitación.");
      return;
    }

    onSubmit(trimmed);
  }

  const submitDisabled =
    inviteCode.trim().length === 0 || Boolean(isSubmitting);
  const errorMessage = localError ?? submitError ?? null;

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="join-form"
      className="flex flex-col gap-6"
      noValidate
    >
      <div className="flex flex-col items-center gap-2">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-surface text-2xl"
        >
          #
        </span>
        <p className="text-center text-base font-semibold text-text-primary">
          Pedile el código de invitación al admin del grupo
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="join-invite-code"
          className="text-center text-sm font-bold text-text-primary"
        >
          Código de invitación
        </label>
        <input
          id="join-invite-code"
          type="text"
          value={inviteCode}
          onChange={handleChange}
          placeholder="ABCD1234"
          maxLength={CODE_MAX}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          className="h-16 rounded-2xl border border-border bg-surface text-center text-2xl font-extrabold tracking-[0.3em] text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-center text-[11px] text-text-tertiary">
          8 caracteres, letras y números
        </span>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          data-testid="join-form-error"
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          data-testid="join-form-cancel"
          className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitDisabled}
          data-testid="join-form-submit"
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-text-on-primary transition",
            submitDisabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-primary-dark",
          )}
        >
          {isSubmitting ? "Uniéndose…" : "Unirme al grupo"}
        </button>
      </div>
    </form>
  );
}
