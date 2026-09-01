import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'stamp';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

// "primary"/"danger" carregam o peso visual das ações principais — versal,
// tracking largo, cor sólida — enquanto as demais variantes recuam para não
// competir com elas. É essa diferença de peso que cria hierarquia, não a cor.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand-900)] text-white uppercase tracking-wide font-bold hover:bg-[var(--color-brand-800)] disabled:bg-[var(--color-brand-300)] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]',
  secondary: 'bg-[var(--color-brand-50)] text-[var(--color-brand-800)] font-semibold hover:bg-[var(--color-brand-100)]',
  outline: 'bg-white border-[1.5px] border-[var(--color-border-strong)] text-[var(--color-ink-700)] font-medium hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-700)]',
  ghost: 'bg-transparent text-[var(--color-ink-700)] font-medium hover:bg-[var(--color-surface-alt)]',
  danger: 'bg-[var(--color-danger-600)] text-white uppercase tracking-wide font-bold hover:bg-[var(--color-danger-700)] disabled:opacity-60',
  // Estilo "carimbo de aprovação" — borda tracejada, mono, para ações como
  // aprovar/validar um registro.
  stamp:
    'bg-transparent border-2 border-dashed border-[var(--color-brand-700)] text-[var(--color-brand-800)] font-mono font-semibold uppercase tracking-wide hover:bg-[var(--color-brand-50)]',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-[11px] px-3 py-1.5 gap-1.5',
  md: 'text-xs px-4 py-2.5 gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center rounded-[6px] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-safety-500)] focus-visible:ring-offset-1',
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
