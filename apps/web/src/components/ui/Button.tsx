import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)] disabled:bg-[var(--color-brand-300)]',
  secondary: 'bg-[var(--color-brand-50)] text-[var(--color-brand-800)] hover:bg-[var(--color-brand-100)]',
  outline: 'bg-white border border-[var(--color-border-strong)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface-alt)]',
  ghost: 'bg-transparent text-[var(--color-ink-700)] hover:bg-[var(--color-surface-alt)]',
  danger: 'bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)] disabled:opacity-60',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)] focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-70',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
