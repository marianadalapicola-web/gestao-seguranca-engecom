import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { globalSearch } from '../../features/search/api';

export function GlobalSearch() {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => globalSearch(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const groups = data?.groups ?? [];

  return (
    <div ref={containerRef} className="relative w-full max-w-sm hidden md:block">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Pesquisar pessoas, DDS, desvios, planos de ação..."
        className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)] focus:bg-white"
      />
      {term && (
        <button
          onClick={() => {
            setTerm('');
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
        >
          <X size={14} />
        </button>
      )}

      {open && debounced.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-96 overflow-y-auto scrollbar-thin z-40">
          {isFetching && <p className="text-xs text-[var(--color-ink-500)] px-4 py-3">Buscando...</p>}
          {!isFetching && groups.length === 0 && (
            <p className="text-xs text-[var(--color-ink-500)] px-4 py-3">Nenhum resultado para "{debounced}".</p>
          )}
          {groups.map((group) => (
            <div key={group.module} className="py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-400)]">{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    setTerm('');
                    navigate(item.link);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface-alt)]"
                >
                  <p className="text-sm text-[var(--color-ink-900)] truncate">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-[var(--color-ink-500)] truncate">{item.subtitle}</p>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
