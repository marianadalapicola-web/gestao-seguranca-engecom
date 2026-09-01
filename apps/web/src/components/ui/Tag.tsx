import type { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'brand' | 'safety' | 'ink' | 'ghost';

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'border-[var(--color-brand-700)] text-[var(--color-brand-800)] bg-[var(--color-brand-50)]',
  safety: 'border-[var(--color-safety-600)] text-[var(--color-safety-600)] bg-[var(--color-safety-100)]',
  ink: 'border-[var(--color-ink-700)] text-[var(--color-ink-700)] bg-white',
  ghost: 'border-white/30 text-white bg-white/10',
};

/** Etiqueta/carimbo técnico — a unidade decorativa recorrente da marca
 * (NR-35, DDS, APR, RISCO...), usada com moderação em áreas estratégicas. */
export function Tag({ children, tone = 'brand', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={clsx('tag-stamp inline-flex items-center border px-2.5 py-1', TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}

/** Trilha Obra → Setor → Equipe — deixa a hierarquia operacional explícita
 * onde ela importa (cabeçalho de filtros, perfil de líder). */
export function OperationPath({ items }: { items: Array<{ label: string; sublabel: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          {i > 0 && <span className="text-[var(--color-border-strong)] text-lg leading-none">/</span>}
          <div className="flex flex-col leading-tight">
            <span className="eyebrow text-[var(--color-ink-400)]">{item.sublabel}</span>
            <span className="text-sm font-bold text-[var(--color-ink-900)]">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
