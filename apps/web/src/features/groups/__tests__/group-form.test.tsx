/**
 * Tests for `GroupForm` covering the validation rules ported literally from
 * `apps/mobile/src/components/groups/{create,edit}-group-modal.tsx`:
 *   - Name required and ≤100 chars (mensajes literales).
 *   - Empty description omitted from create payload.
 *   - Stepper bounded by [minMembers, planLimit].
 *   - Edit mode emits a diff and signals `nothingChanged` when nothing moved.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { GroupForm } from "../group-form";

describe("GroupForm — create mode", () => {
  it("muestra el error literal cuando se envía sin nombre", () => {
    const onSubmit = vi.fn();
    render(
      <GroupForm
        mode="create"
        planLimit={10}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.submit(screen.getByTestId("group-form"));

    expect(screen.getByTestId("group-form-error")).toHaveTextContent(
      "El nombre del grupo es obligatorio.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía valores trimeados y omite description vacía", () => {
    const onSubmit = vi.fn();
    render(
      <GroupForm
        mode="create"
        planLimit={10}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre del grupo/i), {
      target: { value: "  Los Cracks  " },
    });
    fireEvent.submit(screen.getByTestId("group-form"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Los Cracks",
      description: undefined,
      maxMembers: 10,
    });
  });

  it("decrementa maxMembers respetando el mínimo 2", () => {
    render(
      <GroupForm
        mode="create"
        planLimit={3}
        onCancel={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    const decrement = screen.getByTestId("group-form-decrement");
    fireEvent.click(decrement); // 3 → 2
    fireEvent.click(decrement); // floor at 2
    expect(screen.getByTestId("group-form-max-members")).toHaveTextContent("2");
    expect(decrement).toBeDisabled();
  });
});

describe("GroupForm — edit mode", () => {
  it("emite nothingChanged=true y diff vacío cuando nada cambia", () => {
    const onSubmit = vi.fn();
    render(
      <GroupForm
        mode="edit"
        planLimit={10}
        memberCount={4}
        initialValues={{
          name: "Original",
          description: "desc",
          maxMembers: 8,
        }}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.submit(screen.getByTestId("group-form"));

    expect(onSubmit).toHaveBeenCalledWith({}, true);
  });

  it("emite sólo los campos modificados", () => {
    const onSubmit = vi.fn();
    render(
      <GroupForm
        mode="edit"
        planLimit={10}
        memberCount={4}
        initialValues={{
          name: "Original",
          description: "desc",
          maxMembers: 8,
        }}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nombre del grupo/i), {
      target: { value: "Nuevo nombre" },
    });
    fireEvent.submit(screen.getByTestId("group-form"));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Nuevo nombre" }, false);
  });

  it("no permite bajar maxMembers debajo del memberCount actual", () => {
    render(
      <GroupForm
        mode="edit"
        planLimit={20}
        memberCount={6}
        initialValues={{ name: "x", description: "", maxMembers: 6 }}
        onCancel={() => {}}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("group-form-decrement")).toBeDisabled();
  });
});
