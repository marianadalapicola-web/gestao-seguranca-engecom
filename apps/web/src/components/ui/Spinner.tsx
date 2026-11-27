import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={clsx('flex items-center justify-center gap-2 py-10 text-[var(--color-ink-500)]', className)}>
      <Loader2 className="animate-spin" size={20} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
