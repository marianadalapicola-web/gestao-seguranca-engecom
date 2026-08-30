import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative bg-white w-full sm:rounded-lg shadow-xl flex flex-col max-h-full sm:max-h-[90vh]',
          SIZE_CLASSES[size]
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <h3 className="text-sm font-semibold text-[var(--color-ink-900)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[var(--color-border)] flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
