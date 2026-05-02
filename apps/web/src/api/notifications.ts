/**
 * Notifications API client — port literal de
 * `apps/mobile/src/api/notifications.ts`.
 *
 * Los nombres de función, el shape de params y la convención de paths
 * deben coincidir 1:1 con mobile para que la lógica de invalidación en
 * los hooks (compartidos por nombre) funcione idénticamente en ambos
 * clientes.
 */
import type { NotificationDto } from "@pichichi/shared";

import { api } from "./client";

export async function getNotifications(
  limit = 20,
  offset = 0,
): Promise<NotificationDto[]> {
  const { data } = await api.get<NotificationDto[]>("/notifications", {
    params: { limit, offset },
  });
  return data;
}

export async function markAsRead(id: string): Promise<NotificationDto> {
  const { data } = await api.patch<NotificationDto>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>(
    "/notifications/unread-count",
  );
  return data;
}
