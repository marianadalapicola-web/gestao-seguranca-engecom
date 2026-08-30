import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../routes/navigation';

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { can } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => can(item.module, 'read'));

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-md bg-[var(--color-brand-600)] flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight truncate">ENGECOM</p>
          <p className="text-[11px] text-[var(--color-brand-200)] leading-tight truncate">Gestão de Segurança</p>
        </div>
        <button onClick={onCloseMobile} className="ml-auto text-white/70 hover:text-white lg:hidden">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-0.5 transition-colors',
                isActive
                  ? 'bg-[var(--color-brand-600)] text-white font-medium'
                  : 'text-[var(--color-brand-100)] hover:bg-white/10'
              )
            }
          >
            <item.icon size={17} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-[var(--color-brand-300)]">
        © {new Date().getFullYear()} ENGECOM — Segurança do Trabalho
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-[var(--color-brand-900)] h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[var(--color-brand-900)] shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
