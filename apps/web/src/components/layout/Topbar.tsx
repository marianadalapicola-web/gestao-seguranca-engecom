import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resolveAssetUrl } from '../../lib/api';
import { NotificationBell } from './NotificationBell';
import { GlobalSearch } from './GlobalSearch';

const TODAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center gap-3">
      <button onClick={onOpenMobileMenu} className="lg:hidden text-[var(--color-ink-700)]" aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <div className="hidden sm:block min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink-900)] truncate">Olá, {user?.name.split(' ')[0]}</p>
        <p className="text-xs text-[var(--color-ink-500)] capitalize truncate">{TODAY}</p>
      </div>

      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1.5 pr-1 sm:pr-2 py-1 rounded-md hover:bg-[var(--color-surface-alt)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-700)] text-white text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={resolveAssetUrl(user.avatarUrl)!} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-medium text-[var(--color-ink-900)] truncate max-w-[140px]">{user?.name}</p>
              <p className="text-[11px] text-[var(--color-ink-500)] truncate max-w-[140px]">{user?.roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-[var(--color-ink-400)] hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-40 overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/perfil');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-ink-700)] hover:bg-[var(--color-surface-alt)]"
                >
                  <User size={15} /> Meu Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] border-t border-[var(--color-border)]"
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
