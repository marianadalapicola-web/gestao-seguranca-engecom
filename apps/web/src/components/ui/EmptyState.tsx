import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'Não há registros para este período.',
  description = 'Comece adicionando o primeiro registro.',
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-12 h-12 corner-notch bg-[var(--color-brand-50)] text-[var(--color-brand-600)] flex items-center justify-center mb-4">
        {icon ?? <Inbox size={22} />}
      </div>
      <p className="text-sm font-bold text-[var(--color-ink-900)]">{title}</p>
      {description && <p className="text-sm text-[var(--color-ink-500)] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
