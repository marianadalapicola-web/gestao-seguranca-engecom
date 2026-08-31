import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { inputClasses } from './Field';

export interface ComboboxOption {
  id: string;
  name: string;
}

/**
 * Text field that doubles as a picker: typing filters existing options, and
 * a value with no exact match is created on the fly via `onCreate` instead
 * of forcing the user to register it elsewhere first. Keeps the underlying
 * data as real, deduplicated records (matched case-insensitively) rather
 * than free text, so grouping/filtering elsewhere in the system still works.
 */
export function Combobox({
  value,
  options,
  onSelect,
  onCreate,
  placeholder,
  disabled,
  hasError,
}: {
  value: string;
  options: ComboboxOption[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<ComboboxOption>;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const selected = options.find((o) => o.id === value) ?? null;
  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.name ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selected?.name]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = useMemo(
    () => options.find((o) => o.name.trim().toLowerCase() === query.trim().toLowerCase()) ?? null,
    [options, query]
  );

  async function commit() {
    const trimmed = query.trim();
    if (!trimmed) {
      if (value) onSelect('');
      return;
    }
    if (exactMatch) {
      if (exactMatch.id !== value) onSelect(exactMatch.id);
      setQuery(exactMatch.name);
      return;
    }
    if (trimmed === selected?.name) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      onSelect(created.id);
      setQuery(created.name);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClasses(hasError) + ' w-full pr-8'}
        value={query}
        disabled={disabled || creating}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            setOpen(false);
          }
          if (e.key === 'Escape') {
            setQuery(selected?.name ?? '');
            setOpen(false);
          }
        }}
        onBlur={commit}
      />
      {creating && (
        <Loader2 size={14} className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
      )}
      {open && !creating && !disabled && (filtered.length > 0 || query.trim()) && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-[var(--color-border-strong)] bg-white shadow-lg py-1 scrollbar-thin">
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--color-brand-50)] text-[var(--color-ink-900)]"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(opt.id);
                setQuery(opt.name);
                setOpen(false);
              }}
            >
              {opt.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] flex items-center gap-1.5 border-t border-[var(--color-border)]"
              onMouseDown={(e) => {
                e.preventDefault();
                commit();
                setOpen(false);
              }}
            >
              <Plus size={13} /> Cadastrar "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
