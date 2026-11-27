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
          <tr className="border-b-2 border-[var(--color-ink-900)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'eyebrow text-left text-[var(--color-ink-500)] py-2.5 px-3 whitespace-nowrap',
                  col.hideOnMobile && 'hidden sm:table-cell',
                  col.sortable && 'cursor-pointer select-none hover:text-[var(--color-brand-700)]',
                  col.className
                )}
                onClick={() => col.sortable && onSortChange?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable &&
                    (sortBy === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp size={11} />
                      ) : (
                        <ArrowDown size={11} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowId(row)}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'group border-b border-[var(--color-border)] last:border-0 transition-colors',
                i % 2 === 1 && 'bg-[var(--color-surface)]/60',
                onRowClick && 'cursor-pointer hover:bg-[var(--color-brand-50)]'
              )}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key}
                  className={clsx(
                    'relative py-3 px-3 text-[var(--color-ink-900)]',
                    col.hideOnMobile && 'hidden sm:table-cell',
                    col.className
                  )}
                >
                  {colIdx === 0 && onRowClick && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-[var(--color-safety-500)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
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
