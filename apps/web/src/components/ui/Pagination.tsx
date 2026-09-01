import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4 mt-1 border-t border-[var(--color-border)] flex-wrap gap-2">
      <p className="text-xs text-[var(--color-ink-500)]">
        Mostrando <span className="font-medium text-[var(--color-ink-700)]">{from}</span>–
        <span className="font-medium text-[var(--color-ink-700)]">{to}</span> de{' '}
        <span className="font-medium text-[var(--color-ink-700)]">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={14} /> Anterior
        </Button>
        <span className="text-xs text-[var(--color-ink-500)] px-1">
          Página {page} de {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Próxima <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
