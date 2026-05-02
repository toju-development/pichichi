/**
 * NotificationBell smoke tests.
 *
 * Cubre el contrato visual del bell del topbar:
 *   - count === 0 → badge oculto, aria-label "Notificaciones".
 *   - 0 < count <= 99 → badge visible con número, aria-label con conteo.
 *   - count > 99 → badge muestra "99+".
 *
 * Mockea `useUnreadCount` directamente para evitar acoplar a TanStack Query
 * o al store de auth. `next/link` se usa nativo en jsdom.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/hooks/use-notifications", () => ({
  useUnreadCount: vi.fn(),
}));

import { useUnreadCount } from "@/hooks/use-notifications";
import { NotificationBell } from "@/features/notifications/notification-bell";

const useUnreadCountMock = vi.mocked(useUnreadCount);

function setCount(count: number | undefined) {
  useUnreadCountMock.mockReturnValue({
    data: count == null ? undefined : { count },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

afterEach(() => {
  cleanup();
  useUnreadCountMock.mockReset();
});

describe("NotificationBell", () => {
  it("oculta el badge cuando no hay unread", () => {
    setCount(0);
    render(<NotificationBell />);

    const badge = screen.getByTestId("app-shell-notifications-badge");
    expect(badge).toHaveClass("hidden");

    const link = screen.getByTestId("app-shell-notifications-button");
    expect(link).toHaveAttribute("aria-label", "Notificaciones");
  });

  it("muestra el contador cuando hay unread", () => {
    setCount(5);
    render(<NotificationBell />);

    const badge = screen.getByTestId("app-shell-notifications-badge");
    expect(badge).not.toHaveClass("hidden");
    expect(badge.textContent).toBe("5");

    const link = screen.getByTestId("app-shell-notifications-button");
    expect(link).toHaveAttribute("aria-label", "Notificaciones, 5 sin leer");
  });

  it("aplica cap '99+' cuando count > 99", () => {
    setCount(150);
    render(<NotificationBell />);

    const badge = screen.getByTestId("app-shell-notifications-badge");
    expect(badge.textContent).toBe("99+");

    const link = screen.getByTestId("app-shell-notifications-button");
    expect(link).toHaveAttribute(
      "aria-label",
      "Notificaciones, 150 sin leer",
    );
  });

  it("trata data undefined como 0 (badge oculto)", () => {
    setCount(undefined);
    render(<NotificationBell />);

    const badge = screen.getByTestId("app-shell-notifications-badge");
    expect(badge).toHaveClass("hidden");
  });
});
