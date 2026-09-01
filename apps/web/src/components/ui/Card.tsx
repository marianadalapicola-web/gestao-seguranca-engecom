import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Accent = 'brand' | 'safety' | 'none';

const ACCENT_CLASSES: Record<Accent, string> = {
  brand: 'before:bg-[var(--color-brand-700)]',
  safety: 'before:bg-[var(--color-safety-500)]',
  none: 'before:bg-transparent',
};

export function Card({
  className,
  style,
  children,
  accent = 'none',
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: Accent }) {
  return (
    <div
      className={clsx(
        'relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg',
        accent !== 'none' && 'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-lg',
        accent !== 'none' && ACCENT_CLASSES[accent],
        className
      )}
      style={{ boxShadow: 'var(--shadow-card)', ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-800)] text-white">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow text-[var(--color-brand-600)] mb-0.5">{eyebrow}</p>}
          <h2 className="text-sm font-bold text-[var(--color-ink-900)] truncate">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
