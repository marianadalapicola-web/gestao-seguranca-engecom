import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sortBy,
  sortDir,
  onSortChange,
  onRowClick,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  if (loading) return <Spinner label="Carregando registros..." />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <div className="overflow-x-auto -mx-5 px-5 scrollbar-thin">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3 whitespace-nowrap',
                  col.hideOnMobile && 'hidden sm:table-cell',
                  col.sortable && 'cursor-pointer select-none hover:text-[var(--color-ink-700)]',
                  col.className
                )}
                onClick={() => col.sortable && onSortChange?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    (sortBy === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'border-b border-[var(--color-border)] last:border-0',
                onRowClick && 'cursor-pointer hover:bg-[var(--color-brand-50)]'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx('py-2.5 px-3 text-[var(--color-ink-900)]', col.hideOnMobile && 'hidden sm:table-cell', col.className)}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
