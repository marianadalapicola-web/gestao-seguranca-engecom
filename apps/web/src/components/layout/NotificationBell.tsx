import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../features/notifications/api';
import type { Notification } from '../../types';

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => fetchNotifications(false),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = data?.unreadCount ?? 0;

  function handleClick(notification: Notification) {
    if (!notification.read) markReadMutation.mutate(notification.id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-700)]"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-danger-600)] text-white text-[10px] leading-4 text-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">Notificações</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs text-[var(--color-brand-700)] hover:underline inline-flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {!data || data.items.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-500)] text-center py-8 px-4">Nenhuma notificação por aqui.</p>
              ) : (
                data.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={clsx(
                      'w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-alt)]',
                      !n.read && 'bg-[var(--color-brand-50)]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-brand-600)] shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink-900)] truncate">{n.title}</p>
                        <p className="text-xs text-[var(--color-ink-500)] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-[var(--color-ink-400)] mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/notificacoes');
              }}
              className="w-full text-center text-xs font-medium text-[var(--color-brand-700)] py-2.5 border-t border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]"
            >
              Ver todas as notificações
            </button>
          </div>
        </>
      )}
    </div>
  );
}
