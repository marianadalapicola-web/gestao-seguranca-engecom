import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../routes/navigation';

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { can } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => can(item.module, 'read'));

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <img src="/logo-engecom.png" alt="ENGECOM" className="h-8 w-auto shrink-0" />
          <button onClick={onCloseMobile} className="ml-auto text-white/70 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>
        <p className="text-[11px] font-medium text-[var(--color-brand-200)] tracking-wide uppercase mt-2">
          Gestão de Segurança
        </p>
      </div>
      <div className="h-[3px] safety-stripe opacity-80" />

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors',
                isActive ? 'bg-white/10 text-white font-medium' : 'text-[var(--color-brand-100)] hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all',
                    isActive ? 'h-5 bg-[var(--color-safety-500)]' : 'h-0 bg-transparent'
                  )}
                />
                <span
                  className={clsx(
                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors',
                    isActive ? 'bg-[var(--color-brand-500)] text-white' : 'text-[var(--color-brand-300)] group-hover:text-white'
                  )}
                >
                  <item.icon size={16} />
                </span>
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-3.5 border-t border-white/10 text-[10px] text-[var(--color-brand-300)]">
        © {new Date().getFullYear()} ENGECOM — Segurança do Trabalho
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 brand-gradient h-screen sticky top-0">{content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 brand-gradient shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
