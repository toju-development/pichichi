import type { NotificationDto } from '@pichichi/shared';

import { api } from './client';

export async function getNotifications(
  limit = 20,
  offset = 0,
): Promise<NotificationDto[]> {
  const { data } = await api.get<NotificationDto[]>('/notifications', {
    params: { limit, offset },
  });
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
  console.log('[Notifications] 📊 Fetching unread count');
  const { data } = await api.get<{ count: number }>(
    '/notifications/unread-count',
  );
  return data;
}
