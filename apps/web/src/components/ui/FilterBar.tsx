import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Pesquisar...',
  children,
  onClear,
  hasActiveFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>
      {children}
      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X size={14} /> Limpar filtros
        </Button>
      )}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-400)]"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
