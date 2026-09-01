import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Action, ModuleKey } from '../types';

export function RequirePermission({
  module,
  action = 'read',
  children,
}: {
  module: ModuleKey;
  action?: Action;
  children: ReactNode;
}) {
  const { can } = useAuth();

  if (!can(module, action)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-danger-50)] text-[var(--color-danger-600)] flex items-center justify-center mb-4">
          <ShieldAlert size={26} />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">Acesso restrito</h2>
        <p className="text-sm text-[var(--color-ink-500)] mt-1 max-w-sm">
          Seu perfil de acesso não tem permissão para visualizar esta área do sistema.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
