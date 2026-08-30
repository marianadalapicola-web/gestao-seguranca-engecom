import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-[var(--color-ink-700)]">
        {label}
        {required && <span className="text-[var(--color-danger-600)] ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-danger-600)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-ink-500)]">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)] disabled:bg-[var(--color-surface-alt)] disabled:cursor-not-allowed';

export function inputClasses(hasError?: boolean) {
  return clsx(inputBase, hasError ? 'border-[var(--color-danger-600)]' : 'border-[var(--color-border-strong)]');
}
