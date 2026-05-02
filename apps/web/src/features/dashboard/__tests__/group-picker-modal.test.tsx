/**
 * GroupPickerModal component tests.
 *
 * Cubre paridad mobile + a11y web:
 *   - NO renderiza si visible=false
 *   - render con role=dialog + aria-modal + aria-labelledby + título literal
 *   - render del título "¿En qué grupo querés pronosticar?" (literal mobile)
 *   - render con 2 groups → 2 rows con sus nombres
 *   - click en row dispara onSelect(group) y onClose
 *   - backdrop click cierra
 *   - ESC cierra
 *   - row con hasPrediction muestra el score predicho (e.g. "2-1")
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  GroupPickerModal,
  type GroupPickerEntry,
} from "@/features/dashboard/group-picker-modal";

const groupsFixture: GroupPickerEntry[] = [
  {
    groupId: "g-1",
    groupName: "Los del finde",
    tournamentSlug: "world-cup-2026",
    hasPrediction: false,
    predictedHome: null,
    predictedAway: null,
  },
  {
    groupId: "g-2",
    groupName: "Oficina",
    tournamentSlug: "world-cup-2026",
    hasPrediction: true,
    predictedHome: 2,
    predictedAway: 1,
  },
];

function renderPicker(props: {
  visible: boolean;
  groups?: GroupPickerEntry[];
  onSelect?: (group: GroupPickerEntry) => void;
  onClose?: () => void;
}) {
  const onSelect = props.onSelect ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();
  const utils = render(
    <GroupPickerModal
      visible={props.visible}
      groups={props.groups ?? groupsFixture}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { ...utils, onSelect, onClose };
}

describe("GroupPickerModal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("NO renderiza cuando visible=false", () => {
    renderPicker({ visible: false });
    expect(screen.queryByTestId("group-picker-modal")).toBeNull();
  });

  it("render con role=dialog + aria-modal + aria-labelledby + título literal", () => {
    renderPicker({ visible: true });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "group-picker-modal-title",
    );
    // Literal mobile copy
    expect(
      screen.getByText("¿En qué grupo querés pronosticar?"),
    ).toBeInTheDocument();
  });

  it("renderiza una row por cada group con su nombre", () => {
    renderPicker({ visible: true });

    expect(screen.getByText("Los del finde")).toBeInTheDocument();
    expect(screen.getByText("Oficina")).toBeInTheDocument();
    expect(screen.getByTestId("group-picker-row-g-1")).toBeInTheDocument();
    expect(screen.getByTestId("group-picker-row-g-2")).toBeInTheDocument();
  });

  it("row con hasPrediction=true muestra el score predicho", () => {
    renderPicker({ visible: true });

    // g-2 tiene 2-1
    const row = screen.getByTestId("group-picker-row-g-2");
    expect(row.textContent).toContain("2-1");
  });

  it("click en row dispara onSelect(group) y onClose", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderPicker({ visible: true, onSelect, onClose });

    fireEvent.click(screen.getByTestId("group-picker-row-g-1"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(groupsFixture[0]);
  });

  it("backdrop click cierra el modal", () => {
    const onClose = vi.fn();
    renderPicker({ visible: true, onClose });

    fireEvent.click(screen.getByTestId("group-picker-modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC cierra el modal", () => {
    const onClose = vi.fn();
    renderPicker({ visible: true, onClose });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
