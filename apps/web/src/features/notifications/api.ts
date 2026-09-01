import { api } from '../../lib/api';
import type { Notification } from '../../types';

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

export async function fetchNotifications(unreadOnly = false): Promise<NotificationsResponse> {
  const { data } = await api.get('/notifications', { params: { unreadOnly, pageSize: 20 } });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function broadcastNotification(payload: { title: string; message: string; roles?: string[] }): Promise<void> {
  await api.post('/notifications/broadcast', payload);
}
