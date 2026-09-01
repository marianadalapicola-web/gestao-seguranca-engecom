import clsx from 'clsx';
import type { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

// Etiqueta de status como uma "flag técnica": fundo suave + borda esquerda
// sólida na cor do estado, texto mono versalete — lê como um indicador de
// engenharia, não como um chip de app genérico.
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-[var(--color-surface-alt)] text-[var(--color-ink-700)] border-l-[var(--color-ink-400)]',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border-l-[var(--color-success-600)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border-l-[var(--color-warning-600)]',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)] border-l-[var(--color-danger-600)]',
  info: 'bg-[var(--color-info-50)] text-[var(--color-info-700)] border-l-[var(--color-info-600)]',
  brand: 'bg-[var(--color-brand-100)] text-[var(--color-brand-800)] border-l-[var(--color-brand-600)]',
};

export function Badge({ variant = 'neutral', children }: { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-[3px] border-l-[3px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap',
        VARIANT_CLASSES[variant]
      )}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PLANNED: { label: 'Planejado', variant: 'info' },
  IN_PROGRESS: { label: 'Em andamento', variant: 'warning' },
  COMPLETED: { label: 'Concluído', variant: 'success' },
  PENDING: { label: 'Pendente', variant: 'warning' },
  CANCELED: { label: 'Cancelado', variant: 'neutral' },
  OPEN: { label: 'Aberto', variant: 'warning' },
  IN_TREATMENT: { label: 'Em tratamento', variant: 'warning' },
  RESOLVED: { label: 'Resolvido', variant: 'success' },
  INVESTIGATING: { label: 'Em investigação', variant: 'warning' },
  CLOSED: { label: 'Encerrado', variant: 'neutral' },
  IN_ANALYSIS: { label: 'Em análise', variant: 'warning' },
  TREATED: { label: 'Tratado', variant: 'success' },
  OVERDUE: { label: 'Vencido', variant: 'danger' },
  ACTIVE: { label: 'Ativo', variant: 'success' },
  BLOCKED: { label: 'Bloqueado', variant: 'danger' },
  LOW: { label: 'Baixa', variant: 'neutral' },
  MEDIUM: { label: 'Média', variant: 'warning' },
  HIGH: { label: 'Alta', variant: 'danger' },
  CRITICAL: { label: 'Crítica', variant: 'danger' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: 'neutral' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
