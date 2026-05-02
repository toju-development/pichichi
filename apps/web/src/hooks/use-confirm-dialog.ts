"use client";

/**
 * useConfirmDialog — promise-based wrapper sobre `<ConfirmDialog />`.
 *
 * Permite imperativamente esperar la decisión del usuario:
 *
 * ```tsx
 * const { confirm, dialogProps } = useConfirmDialog();
 *
 * async function handleDelete() {
 *   const ok = await confirm({
 *     title: "Eliminar grupo",
 *     description: "Esta acción no se puede deshacer.",
 *     variant: "danger",
 *     confirmLabel: "Eliminar",
 *   });
 *   if (!ok) return;
 *   await deleteGroup();
 * }
 *
 * return <>... <ConfirmDialog {...dialogProps} /></>;
 * ```
 *
 * Internamente: `confirm(opts)` setea state + guarda un `resolveRef` que
 * resuelve la promesa cuando el user clickea confirm (true) o cancel (false).
 */

import { useRef, useState } from "react";

import type { ConfirmDialogProps } from "@/features/shared/confirm-dialog";

type ConfirmOptions = Omit<
  ConfirmDialogProps,
  "open" | "onClose" | "onConfirm" | "testId"
> & {
  testId?: string;
};

interface UseConfirmDialogResult {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  dialogProps: ConfirmDialogProps;
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  function confirm(opts: ConfirmOptions): Promise<boolean> {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function settle(result: boolean) {
    setOpen(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(result);
  }

  const dialogProps: ConfirmDialogProps = {
    ...options,
    open,
    onClose: () => settle(false),
    onConfirm: () => settle(true),
  };

  return { confirm, dialogProps };
}
