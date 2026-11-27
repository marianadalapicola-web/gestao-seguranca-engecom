import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api';
import type { Notification } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/format';

const TYPE_LABELS: Record<string, string> = {
  ACTION_PLAN_DUE_SOON: 'Plano de ação próximo do vencimento',
  ACTION_PLAN_OVERDUE: 'Plano de ação vencido',
  NEW_ASSIGNMENT: 'Nova atribuição',
  INSPECTION_PENDING: 'Inspeção pendente',
  RECORD_AWAITING_ACTION: 'Registro aguardando ação',
  ADMIN_NOTICE: 'Aviso administrativo',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'full'],
    queryFn: () => fetchNotifications(false),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function handleClick(n: Notification) {
    if (!n.read) markReadMutation.mutate(n.id);
    if (n.link) navigate(n.link);
  }

  return (
    <div>
      <PageHeader
        title="Notificações"
        subtitle="Alertas sobre prazos, atribuições e avisos do sistema."
        actions={
          (data?.unreadCount ?? 0) > 0 && (
            <Button variant="outline" onClick={() => markAllMutation.mutate()}>
              <CheckCheck size={15} /> Marcar todas como lidas
            </Button>
          )
        }
      />

      <Card>
        <CardBody>
          {isLoading ? (
            <Spinner />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Nenhuma notificação por aqui." description="Você será avisado sobre prazos e atribuições importantes." />
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={clsx('w-full text-left py-3.5 flex items-start gap-3 hover:bg-[var(--color-surface-alt)] px-2 rounded-md', !n.read && 'bg-[var(--color-brand-50)]')}
                  >
                    {!n.read && <span className="mt-2 w-2 h-2 rounded-full bg-[var(--color-brand-600)] shrink-0" />}
                    <div className={clsx('flex-1 min-w-0', n.read && 'ml-5')}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--color-ink-900)]">{n.title}</p>
                        <span className="text-xs text-[var(--color-ink-400)] shrink-0">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[var(--color-ink-600)] mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-[var(--color-ink-400)] mt-1">{TYPE_LABELS[n.type] ?? n.type}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
