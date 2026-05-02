/**
 * NotificationsList smoke tests.
 *
 * Cubre los estados del listado paginado:
 *   - loading → LoadingScreen testId.
 *   - error → ErrorState testId.
 *   - empty (entries === 0) → EmptyState testId.
 *   - entries presentes → render items + opcional botón "Cargar más".
 *   - sin hasNextPage → no renderiza el botón.
 *   - isFetchingNextPage → muestra "Cargando…" en el botón.
 *
 * Mockea `useNotifications` directamente.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { NotificationDto } from "@pichichi/shared";

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: vi.fn(),
}));

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsList } from "@/features/notifications/notifications-list";

const useNotificationsMock = vi.mocked(useNotifications);

function makeNotification(
  id: string,
  overrides: Partial<NotificationDto> = {},
): NotificationDto {
  return {
    id,
    type: "MATCH_RESULT",
    title: `Notification ${id}`,
    body: "Body",
    data: null,
    isRead: false,
    createdAt: "2026-06-11T12:00:00.000Z",
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setQuery(state: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useNotificationsMock.mockReturnValue(state as any);
}

afterEach(() => {
  cleanup();
  useNotificationsMock.mockReset();
});

describe("NotificationsList", () => {
  it("muestra loading mientras la query carga", () => {
    setQuery({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    render(<NotificationsList />);
    expect(
      screen.getByTestId("notifications-list-loading"),
    ).toBeInTheDocument();
  });

  it("muestra error cuando query.isError", () => {
    setQuery({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    render(<NotificationsList />);
    expect(screen.getByTestId("notifications-list-error")).toBeInTheDocument();
  });

  it("muestra empty cuando no hay notificaciones", () => {
    setQuery({
      isLoading: false,
      isError: false,
      data: { pages: [[]] },
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    render(<NotificationsList />);
    expect(screen.getByTestId("notifications-list-empty")).toBeInTheDocument();
  });

  it("renderiza items y NO muestra botón cuando no hay próxima página", () => {
    setQuery({
      isLoading: false,
      isError: false,
      data: {
        pages: [[makeNotification("n-1"), makeNotification("n-2")]],
      },
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    render(<NotificationsList />);

    expect(screen.getByTestId("notifications-list")).toBeInTheDocument();
    expect(screen.getAllByTestId("notification-item")).toHaveLength(2);
    expect(
      screen.queryByTestId("notifications-list-load-more"),
    ).not.toBeInTheDocument();
  });

  it("muestra botón 'Cargar más' y dispara fetchNextPage al click", () => {
    const fetchNextPage = vi.fn();
    setQuery({
      isLoading: false,
      isError: false,
      data: { pages: [[makeNotification("n-1")]] },
      refetch: vi.fn(),
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });
    render(<NotificationsList />);

    const button = screen.getByTestId("notifications-list-load-more");
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain("Cargar más");

    fireEvent.click(button);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("muestra 'Cargando…' mientras isFetchingNextPage", () => {
    setQuery({
      isLoading: false,
      isError: false,
      data: { pages: [[makeNotification("n-1")]] },
      refetch: vi.fn(),
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: true,
    });
    render(<NotificationsList />);

    expect(
      screen.getByTestId("notifications-list-loading-more"),
    ).toBeInTheDocument();
  });
});
