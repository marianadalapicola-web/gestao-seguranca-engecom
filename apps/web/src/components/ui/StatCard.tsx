import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_BADGE: Record<Tone, string> = {
  brand: 'bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] text-white',
  success: 'bg-gradient-to-br from-[#22c55e] to-[var(--color-success-700)] text-white',
  warning: 'bg-gradient-to-br from-[var(--color-safety-500)] to-[var(--color-warning-700)] text-white',
  danger: 'bg-gradient-to-br from-[#ef4444] to-[var(--color-danger-700)] text-white',
  neutral: 'bg-gradient-to-br from-[var(--color-ink-400)] to-[var(--color-ink-700)] text-white',
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
    <div
      className="relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3 min-w-0 transition-shadow hover:[box-shadow:var(--shadow-elevated)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {icon && (
        <div className={clsx('pointer-events-none absolute -right-3 -top-3 w-16 h-16 rounded-2xl rotate-12 opacity-[0.07]', TONE_BADGE[tone])} />
      )}
      <div className="flex items-center justify-between relative">
        <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide truncate">{label}</p>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', TONE_BADGE[tone])}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-[var(--color-ink-900)] truncate relative">{value}</p>
      {(trend || hint) && (
        <div className="flex items-center gap-1.5 text-xs relative">
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
