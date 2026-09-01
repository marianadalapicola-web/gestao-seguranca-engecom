import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow text-[var(--color-brand-600)] mb-1.5">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold text-[var(--color-ink-950)] tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-ink-500)] mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>
      <div className="rule-line" />
    </div>
  );
}
