import { describe, expect, it } from "vitest";
import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { useDialogA11y } from "../use-dialog-a11y";

/**
 * Test harness component que monta el panel + backdrop usando el hook.
 * Soporta `initialFocusSelector` y `initialFocusRef` para cubrir las 3
 * estrategias de focus inicial.
 */
function TestDialog({
  open,
  onClose,
  useRefForFocus = false,
  initialFocusSelector,
  panelButtons = ["First", "Second", "Last"],
}: {
  open: boolean;
  onClose: () => void;
  useRefForFocus?: boolean;
  initialFocusSelector?: string;
  panelButtons?: string[];
}) {
  const focusRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useDialogA11y({
    open,
    onClose,
    initialFocusRef: useRefForFocus ? focusRef : undefined,
    initialFocusSelector,
  });

  return (
    <div>
      <button type="button" data-testid="trigger">
        trigger
      </button>
      {open ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          data-testid="panel"
        >
          {panelButtons.map((label, idx) => {
            const isFocusTarget = useRefForFocus && idx === 1;
            return (
              <button
                key={label}
                type="button"
                ref={isFocusTarget ? focusRef : undefined}
                data-testid={`btn-${label.toLowerCase()}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

describe("useDialogA11y", () => {
  it("locks body scroll while open and restores on close", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <TestDialog open={false} onClose={() => {}} />,
    );
    expect(document.body.style.overflow).toBe("auto");

    rerender(<TestDialog open onClose={() => {}} />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TestDialog open={false} onClose={() => {}} />);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("calls onClose when ESC is pressed", () => {
    let calls = 0;
    render(
      <TestDialog
        open
        onClose={() => {
          calls += 1;
        }}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(calls).toBe(1);
  });

  it("does not call onClose for other keys", () => {
    let calls = 0;
    render(
      <TestDialog
        open
        onClose={() => {
          calls += 1;
        }}
      />,
    );

    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "a" });
    expect(calls).toBe(0);
  });

  it("focuses the first focusable element by default", () => {
    render(<TestDialog open onClose={() => {}} />);
    expect(document.activeElement).toBe(screen.getByTestId("btn-first"));
  });

  it("uses initialFocusSelector when provided", () => {
    render(
      <TestDialog
        open
        onClose={() => {}}
        initialFocusSelector='[data-testid="btn-second"]'
      />,
    );
    expect(document.activeElement).toBe(screen.getByTestId("btn-second"));
  });

  it("uses initialFocusRef when provided (over selector)", () => {
    render(<TestDialog open onClose={() => {}} useRefForFocus />);
    // El ref apunta al "Second" (idx === 1) en el harness.
    expect(document.activeElement).toBe(screen.getByTestId("btn-second"));
  });

  it("traps focus circularly: Tab from last → first", () => {
    render(<TestDialog open onClose={() => {}} />);
    const last = screen.getByTestId("btn-last");
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("btn-first"));
  });

  it("traps focus circularly: Shift+Tab from first → last", () => {
    render(<TestDialog open onClose={() => {}} />);
    const first = screen.getByTestId("btn-first");
    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId("btn-last"));
  });

  it("re-traps focus to first focusable when active is outside the panel", () => {
    render(<TestDialog open onClose={() => {}} />);

    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByTestId("btn-first"));
  });

  it("restores focus to the previously focused element on close", () => {
    const { rerender } = render(
      <TestDialog open={false} onClose={() => {}} />,
    );

    const trigger = screen.getByTestId("trigger");
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(<TestDialog open onClose={() => {}} />);
    // En open, el focus se mueve al primer botón del panel.
    expect(document.activeElement).toBe(screen.getByTestId("btn-first"));

    rerender(<TestDialog open={false} onClose={() => {}} />);
    expect(document.activeElement).toBe(trigger);
  });

  it("does not attach listeners or lock scroll while closed", () => {
    document.body.style.overflow = "auto";
    let calls = 0;
    render(
      <TestDialog
        open={false}
        onClose={() => {
          calls += 1;
        }}
      />,
    );

    expect(document.body.style.overflow).toBe("auto");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(calls).toBe(0);
  });
});
