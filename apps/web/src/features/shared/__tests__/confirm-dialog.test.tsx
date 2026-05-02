/**
 * Smoke test for `<ConfirmDialog />`.
 *
 * Verifica los 4 contratos clave del primitive:
 *   1. Con `open={false}` no renderiza nada en el DOM (createPortal bypass).
 *   2. Con `open={true}` renderiza título + ambos botones.
 *   3. Click en confirm dispara `onConfirm`.
 *   4. Click en cancel dispara `onClose`.
 *
 * NOTA: createPortal monta en `document.body`. testing-library encuentra los
 * nodos igual via `screen.*` porque `screen` busca en `document.body` por
 * default.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "../confirm-dialog";

describe("ConfirmDialog", () => {
  it("no renderiza el dialog cuando open={false}", () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar grupo"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Eliminar grupo")).not.toBeInTheDocument();
  });

  it("renderiza título, descripción y ambos botones cuando open={true}", () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Eliminar grupo"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Eliminar grupo")).toBeInTheDocument();
    expect(
      screen.getByText("Esta acción no se puede deshacer."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Eliminar",
    );
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "Cancelar",
    );
  });

  it("invoca onConfirm cuando el usuario clickea el botón de confirmar", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Eliminar grupo"
        confirmLabel="Eliminar"
      />,
    );

    await user.click(screen.getByTestId("confirm-dialog-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invoca onClose cuando el usuario clickea el botón de cancelar", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Eliminar grupo"
      />,
    );

    await user.click(screen.getByTestId("confirm-dialog-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
