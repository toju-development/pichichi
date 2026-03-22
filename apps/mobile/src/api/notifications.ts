import type { NotificationDto } from '@pichichi/shared';

import { api } from './client';

export async function getNotifications(): Promise<NotificationDto[]> {
  const { data } = await api.get<NotificationDto[]>('/notifications');
  return data;
}

export async function markAsRead(
  id: string,
): Promise<NotificationDto> {
  const { data } = await api.patch<NotificationDto>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>(
    '/notifications/unread-count',
  );
  return data;
}
