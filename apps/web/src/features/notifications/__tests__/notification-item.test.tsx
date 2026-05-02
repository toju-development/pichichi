/**
 * NotificationItem smoke tests.
 *
 * Cubre el contrato visual de la fila individual:
 *   - render de title, body, timestamp y testid raíz
 *   - mapeo de `type` → icon emoji (MATCH_RESULT → 🏟️, GROUP_INVITE → ✉️)
 *   - fallback "🔔" cuando el type no está en `TYPE_ICONS`
 *   - `formatRelativeTime` (export pública) para los principales rangos:
 *     "ahora", "hace N min", "hace N horas", "ayer", "hace N días",
 *     "hace N semanas" y "hace N meses".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { NotificationDto } from "@pichichi/shared";

import {
  NotificationItem,
  formatRelativeTime,
} from "@/features/notifications/notification-item";

function makeNotification(
  overrides: Partial<NotificationDto> = {},
): NotificationDto {
  return {
    id: "n-1",
    type: "MATCH_RESULT",
    title: "Resultado final",
    body: "Argentina 3 - 0 Brasil",
    data: null,
    isRead: false,
    createdAt: "2026-06-11T12:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("NotificationItem", () => {
  it("renderiza title, body, timestamp y testid raíz", () => {
    // Frozen "now" 1 minuto después de createdAt → "hace 1 min"
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:01:00.000Z"));

    render(<NotificationItem notification={makeNotification()} />);

    expect(screen.getByTestId("notification-item")).toBeInTheDocument();
    expect(screen.getByTestId("notification-item-title").textContent).toBe(
      "Resultado final",
    );
    expect(screen.getByTestId("notification-item-body").textContent).toBe(
      "Argentina 3 - 0 Brasil",
    );
    expect(
      screen.getByTestId("notification-item-timestamp").textContent,
    ).toBe("hace 1 min");
  });

  it("mapea MATCH_RESULT al icono 🏟️", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "MATCH_RESULT" })}
      />,
    );
    expect(
      screen.getByTestId("notification-item-icon").textContent,
    ).toBe("🏟️");
  });

  it("mapea GROUP_INVITE al icono ✉️", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "GROUP_INVITE" })}
      />,
    );
    expect(
      screen.getByTestId("notification-item-icon").textContent,
    ).toBe("✉️");
  });

  it("usa fallback 🔔 cuando el type es desconocido", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "UNKNOWN_TYPE" as never })}
      />,
    );
    expect(
      screen.getByTestId("notification-item-icon").textContent,
    ).toBe("🔔");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 'ahora' cuando diff < 60s", () => {
    expect(formatRelativeTime("2026-06-11T11:59:30.000Z")).toBe("ahora");
  });

  it("retorna 'hace N min' cuando diff < 60min", () => {
    expect(formatRelativeTime("2026-06-11T11:55:00.000Z")).toBe("hace 5 min");
  });

  it("retorna 'hace 1 hora' (singular) cuando diff es 1h", () => {
    expect(formatRelativeTime("2026-06-11T11:00:00.000Z")).toBe("hace 1 hora");
  });

  it("retorna 'hace N horas' (plural) cuando 1 < hours < 24", () => {
    expect(formatRelativeTime("2026-06-11T09:00:00.000Z")).toBe(
      "hace 3 horas",
    );
  });

  it("retorna 'ayer' cuando diff es exactamente 1 día", () => {
    expect(formatRelativeTime("2026-06-10T12:00:00.000Z")).toBe("ayer");
  });

  it("retorna 'hace N días' cuando 1 < days < 7", () => {
    expect(formatRelativeTime("2026-06-08T12:00:00.000Z")).toBe(
      "hace 3 días",
    );
  });

  it("retorna 'hace N semana(s)' cuando 7 <= days < 30", () => {
    expect(formatRelativeTime("2026-06-04T12:00:00.000Z")).toBe(
      "hace 1 semana",
    );
    expect(formatRelativeTime("2026-05-21T12:00:00.000Z")).toBe(
      "hace 3 semanas",
    );
  });

  it("retorna 'hace N mes(es)' cuando days >= 30", () => {
    expect(formatRelativeTime("2026-05-12T12:00:00.000Z")).toBe("hace 1 mes");
    expect(formatRelativeTime("2026-03-13T12:00:00.000Z")).toBe(
      "hace 3 meses",
    );
  });
});
