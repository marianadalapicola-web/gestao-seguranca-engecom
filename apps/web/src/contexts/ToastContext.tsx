import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-white border-l-4 border-l-[var(--color-success-600)] text-[var(--color-ink-900)]',
  error: 'bg-white border-l-4 border-l-[var(--color-danger-600)] text-[var(--color-ink-900)]',
  warning: 'bg-white border-l-4 border-l-[var(--color-warning-600)] text-[var(--color-ink-900)]',
  info: 'bg-white border-l-4 border-l-[var(--color-info-600)] text-[var(--color-ink-900)]',
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-[var(--color-success-600)]',
  error: 'text-[var(--color-danger-600)]',
  warning: 'text-[var(--color-warning-600)]',
  info: 'text-[var(--color-info-600)]',
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              role="alert"
              className={clsx('flex items-start gap-3 rounded-md shadow-lg px-4 py-3 text-sm', STYLES[toast.variant])}
            >
              <Icon size={18} className={clsx('mt-0.5 shrink-0', ICON_COLOR[toast.variant])} />
              <p className="flex-1 leading-snug">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de um ToastProvider.');
  return ctx;
}
