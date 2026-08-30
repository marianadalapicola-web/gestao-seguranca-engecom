import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[var(--color-border)]', className)}>
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-ink-900)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
