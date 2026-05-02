"use client";

/**
 * GroupForm — formulario compartido para crear y editar un grupo.
 *
 * Port literal de las reglas de validación de:
 *   - `apps/mobile/src/components/groups/create-group-modal.tsx` (handleSubmit)
 *   - `apps/mobile/src/components/groups/edit-group-modal.tsx` (handleSubmit)
 *
 * Validación manual con `if` (NO Zod — decisión documentada en spec
 * `web-app-funcional/forms-validation`). Mensajes de error literales
 * en castellano de mobile.
 *
 * Mode `create`:
 *   - maxMembers stepper [2, planLimit].
 *   - Botón "Crear grupo".
 *
 * Mode `edit`:
 *   - maxMembers stepper [max(2, memberCount), planLimit].
 *   - Botón "Guardar cambios".
 *   - Diff vs initial values: si nada cambió, llama `onCancel` (= cerrar).
 *
 * NO portamos selección de torneos (eso es Phase 5A.3).
 */
import { useState } from "react";

import { cn } from "@/lib/cn";

export interface GroupFormValues {
  name: string;
  description?: string;
  maxMembers: number;
}

interface GroupFormBaseProps {
  planLimit: number;
  /** External submit error (e.g. server-side message). */
  submitError?: string | null;
  isSubmitting?: boolean;
  onCancel: () => void;
}

interface CreateGroupFormProps extends GroupFormBaseProps {
  mode: "create";
  onSubmit: (values: GroupFormValues) => void;
}

interface EditGroupFormProps extends GroupFormBaseProps {
  mode: "edit";
  /** Pre-populated values (current group state). */
  initialValues: GroupFormValues;
  /** Current member count — `maxMembers` cannot go below this. */
  memberCount: number;
  /** Receives ONLY changed fields. If nothing changed, parent should close. */
  onSubmit: (
    diff: Partial<GroupFormValues>,
    nothingChanged: boolean,
  ) => void;
}

type GroupFormProps = CreateGroupFormProps | EditGroupFormProps;

const NAME_MAX = 100;
const DESC_MAX = 500;

export function GroupForm(props: GroupFormProps) {
  const { planLimit, submitError, isSubmitting, onCancel, mode } = props;

  const initialName = mode === "edit" ? props.initialValues.name : "";
  const initialDesc =
    mode === "edit" ? props.initialValues.description ?? "" : "";
  const initialMax =
    mode === "edit" ? props.initialValues.maxMembers : planLimit;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDesc);
  const [maxMembers, setMaxMembers] = useState(initialMax);
  const [localError, setLocalError] = useState<string | null>(null);

  const minMembers =
    mode === "edit" ? Math.max(2, props.memberCount) : 2;
  const atMin = maxMembers <= minMembers;
  const atMax = maxMembers >= planLimit;

  function decrementMembers() {
    if (atMin) return;
    setMaxMembers((v) => Math.max(minMembers, v - 1));
  }

  function incrementMembers() {
    if (atMax) return;
    setMaxMembers((v) => Math.min(planLimit, v + 1));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("El nombre del grupo es obligatorio.");
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setLocalError("El nombre no puede tener más de 100 caracteres.");
      return;
    }

    const trimmedDesc = description.trim();

    if (mode === "create") {
      props.onSubmit({
        name: trimmedName,
        description: trimmedDesc || undefined,
        maxMembers,
      });
      return;
    }

    // edit mode — diff vs initial values
    const diff: Partial<GroupFormValues> = {};
    const initial = props.initialValues;

    if (trimmedName !== initial.name) {
      diff.name = trimmedName;
    }
    if (trimmedDesc !== (initial.description ?? "")) {
      diff.description = trimmedDesc;
    }
    if (maxMembers !== initial.maxMembers) {
      diff.maxMembers = maxMembers;
    }

    const nothingChanged = Object.keys(diff).length === 0;
    props.onSubmit(diff, nothingChanged);
  }

  const submitDisabled = !name.trim() || Boolean(isSubmitting);
  const submitLabel = mode === "create" ? "Crear grupo" : "Guardar cambios";
  const submittingLabel =
    mode === "create" ? "Creando…" : "Guardando…";
  const errorMessage = localError ?? submitError ?? null;

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="group-form"
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Field — Nombre */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="group-name"
          className="text-sm font-bold text-text-primary"
        >
          Nombre del grupo *
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Los cracks del mundial"
          maxLength={NAME_MAX}
          autoComplete="off"
          className="h-12 rounded-xl border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-right text-[11px] text-text-tertiary">
          {name.length}/{NAME_MAX}
        </span>
      </div>

      {/* Field — Descripción */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="group-description"
          className="text-sm font-bold text-text-primary"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="group-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="¿De qué se trata el grupo?"
          maxLength={DESC_MAX}
          rows={3}
          className="min-h-[100px] resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <span className="text-right text-[11px] text-text-tertiary">
          {description.length}/{DESC_MAX}
        </span>
      </div>

      {/* Field — Máximo de miembros */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-bold text-text-primary">
          Máximo de miembros
        </legend>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={decrementMembers}
            disabled={atMin}
            data-testid="group-form-decrement"
            aria-label="Disminuir máximo de miembros"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-xl font-bold text-text-primary transition",
              atMin
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary hover:text-primary",
            )}
          >
            −
          </button>
          <span
            data-testid="group-form-max-members"
            className="min-w-[2ch] text-center text-2xl font-extrabold text-text-primary"
          >
            {maxMembers}
          </span>
          <button
            type="button"
            onClick={incrementMembers}
            disabled={atMax}
            data-testid="group-form-increment"
            aria-label="Aumentar máximo de miembros"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-xl font-bold text-text-primary transition",
              atMax
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary hover:text-primary",
            )}
          >
            +
          </button>
        </div>
        <p className="text-[11px] text-text-tertiary">
          Mínimo {minMembers}, máximo {planLimit} (según tu plan)
        </p>
      </fieldset>

      {errorMessage ? (
        <p
          role="alert"
          data-testid="group-form-error"
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          data-testid="group-form-cancel"
          className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitDisabled}
          data-testid="group-form-submit"
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-text-on-primary transition",
            submitDisabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-primary-dark",
          )}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
