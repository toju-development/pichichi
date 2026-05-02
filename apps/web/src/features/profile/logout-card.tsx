"use client";

/**
 * LogoutCard — botón de cerrar sesión con ConfirmDialog.
 *
 * Port web del logout block de `apps/mobile/app/(tabs)/profile.tsx`
 * (líneas 89-107, 199-209). Mobile usa `Alert.alert` nativo; web usa nuestro
 * `<ConfirmDialog />` (mismo título, descripción y label destructive).
 *
 * `useLogout` ya hace `router.replace(ROUTES.app.login)` internamente, así
 * que NO duplicamos el redirect.
 *
 * Selectores estables:
 *   - `profile-logout-button`
 */

import { ConfirmDialog } from "@/features/shared";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useLogout } from "@/hooks/use-logout";

export function LogoutCard() {
  const { mutate, isPending } = useLogout();
  const { confirm, dialogProps } = useConfirmDialog();

  async function handleClick() {
    const ok = await confirm({
      title: "Cerrar sesión",
      description: "¿Estás seguro de que querés cerrar sesión?",
      variant: "danger",
      confirmLabel: "Cerrar sesión",
      cancelLabel: "Cancelar",
      testId: "profile-logout-confirm",
    });
    if (!ok) return;
    await mutate();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={isPending}
        data-testid="profile-logout-button"
        className="inline-flex w-full items-center justify-center rounded-xl border border-danger bg-transparent px-6 py-3.5 text-base font-semibold text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
      <ConfirmDialog {...dialogProps} />
    </>
  );
}
