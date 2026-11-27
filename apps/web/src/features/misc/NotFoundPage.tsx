import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-14 h-14 rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-600)] flex items-center justify-center mb-4">
        <FileQuestion size={26} />
      </div>
      <h2 className="text-base font-semibold text-[var(--color-ink-900)]">Página não encontrada</h2>
      <p className="text-sm text-[var(--color-ink-500)] mt-1 max-w-sm">A página que você tentou acessar não existe ou foi movida.</p>
      <Link to="/" className="mt-4 text-sm text-[var(--color-brand-700)] hover:underline">
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
