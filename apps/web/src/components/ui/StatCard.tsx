import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
  neutral: 'bg-[var(--color-surface-alt)] text-[var(--color-ink-700)]',
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  trend,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  trend?: { value: number; label?: string } | null;
  hint?: string;
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide truncate">{label}</p>
        {icon && <div className={clsx('w-8 h-8 rounded-md flex items-center justify-center shrink-0', TONE_CLASSES[tone])}>{icon}</div>}
      </div>
      <p className="text-2xl font-semibold text-[var(--color-ink-900)] truncate">{value}</p>
      {(trend || hint) && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 font-medium',
                trend.value >= 0 ? 'text-[var(--color-success-700)]' : 'text-[var(--color-danger-700)]'
              )}
            >
              {trend.value >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint && <span className="text-[var(--color-ink-500)]">{hint}</span>}
        </div>
      )}
    </div>
  );
}
