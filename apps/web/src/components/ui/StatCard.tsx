import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_TEXT: Record<Tone, string> = {
  brand: 'text-[var(--color-brand-700)]',
  success: 'text-[var(--color-success-700)]',
  warning: 'text-[var(--color-warning-700)]',
  danger: 'text-[var(--color-danger-700)]',
  neutral: 'text-[var(--color-ink-700)]',
};

const TONE_RULE: Record<Tone, string> = {
  brand: 'bg-[var(--color-brand-600)]',
  success: 'bg-[var(--color-success-600)]',
  warning: 'bg-[var(--color-safety-500)]',
  danger: 'bg-[var(--color-danger-600)]',
  neutral: 'bg-[var(--color-ink-400)]',
};

/**
 * O indicador é o protagonista aqui: número grande e denso, rótulo eyebrow
 * mono acima, uma régua de cor embaixo — sem ícone-fantasma gigante nem
 * gradiente decorativo. É o "SEGURANÇA EM NÚMEROS" do dashboard editorial.
 */
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
      className="relative flex flex-col gap-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 min-w-0 transition-shadow hover:[box-shadow:var(--shadow-elevated)]"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow text-[var(--color-ink-500)] truncate">{label}</p>
        {icon && <span className={clsx('shrink-0', TONE_TEXT[tone])}>{icon}</span>}
      </div>
      <p className={clsx('text-3xl font-extrabold tabular-nums tracking-tight leading-none truncate', TONE_TEXT[tone])}>{value}</p>
      {(trend || hint) && (
        <div className="flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 font-semibold',
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
      <span className={clsx('absolute left-4 right-4 bottom-0 h-[3px] rounded-t-full opacity-70', TONE_RULE[tone])} />
    </div>
  );
}
