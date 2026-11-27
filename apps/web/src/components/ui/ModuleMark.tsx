import type { ComponentType, SVGProps } from 'react';
import type { ModuleKey } from '../../types';

/**
 * Ilustrações de módulo — desenhadas à mão (não emoji, não stock icon) no
 * mesmo peso de traço do Lucide (1.75, round cap/join, sem preenchimento)
 * para conviver lado a lado com os ícones funcionais, mas carregando
 * identidade própria da ENGECOM em pontos estratégicos (cabeçalho de
 * módulo, StatCards de destaque, hero do dashboard).
 */
type MarkProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 28) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function IdsMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M5 22a11 11 0 0 1 22 0" />
      <path d="M16 22 21 12" />
      <circle cx="16" cy="22" r="1.6" fill="currentColor" stroke="none" />
      <path d="M9 26h14" opacity="0.5" />
    </svg>
  );
}

export function DdsMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 9a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H10l-4 4v-4H7a3 3 0 0 1-3-3Z" />
      <path d="M18 12h6a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-1v3l-3.5-3H16" opacity="0.55" />
    </svg>
  );
}

export function RitualMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M6 15v3a2 2 0 0 0 2 2h1l3 5V8l-3 5H8a2 2 0 0 0-2 2Z" />
      <path d="M17 12a6 6 0 0 1 0 8" />
      <path d="M21 9a11 11 0 0 1 0 14" opacity="0.55" />
    </svg>
  );
}

export function InspectionMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="7" y="6" width="16" height="21" rx="2" />
      <path d="M12 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <path d="m11.5 15 2 2 4-4.5" />
      <path d="M11 21h7" opacity="0.55" />
    </svg>
  );
}

export function DeviationMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16 4 29 26H3Z" />
      <path d="M16 13v4.5" />
      <circle cx="16" cy="21.5" r="1.3" fill="currentColor" stroke="none" />
      <path d="M13 17.5 16 21l3.5-4" opacity="0.4" />
    </svg>
  );
}

export function IncidentMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3" opacity="0.5" />
      <circle cx="16" cy="16" r="6" />
    </svg>
  );
}

export function RefusalMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16 4 5 8v8c0 7 5 11 11 12 6-1 11-5 11-12V8Z" />
      <path d="M12 17v-4a2 2 0 0 1 4 0v3M16 16v-1.5a2 2 0 0 1 4 0V17M20 17v-1a1.8 1.8 0 0 1 3.5.4c0 3.6-2 6.6-6 6.6h-2.5c-1.8 0-2.8-.6-3.7-1.8L9 18.5" />
    </svg>
  );
}

export function RankingMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M6 27V17h6v10M13 27V9h6v18M20 27v-7h6v7" />
      <path d="M3 27h26" />
    </svg>
  );
}

export function LeadersMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="10" r="4" />
      <path d="M4 26v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
      <circle cx="23" cy="9" r="3" opacity="0.55" />
      <path d="M21 12.3A5 5 0 0 1 28 17v1.5" opacity="0.55" />
    </svg>
  );
}

export function SiteMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M5 27V13l7-4 7 4v14" />
      <path d="M12 27V17h6M23 27V9l4 2v16" opacity="0.55" />
      <path d="M2 27h28" />
    </svg>
  );
}

export function SectorMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="4" y="5" width="24" height="22" rx="1.5" />
      <path d="M4 14h24M4 20h24M13 5v22M21 5v22" opacity="0.5" />
    </svg>
  );
}

export function ReportMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M8 3h11l6 6v20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M19 3v6h6" opacity="0.55" />
      <path d="M11 17h10M11 21h10M11 13h5" opacity="0.7" />
    </svg>
  );
}

export function ActionPlanMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M8 27V5" />
      <path d="M8 5h15l-3 5 3 5H8" />
      <circle cx="8" cy="27" r="1.6" fill="currentColor" stroke="none" />
      <path d="m14 9 2 2 4-3.5" opacity="0.6" />
    </svg>
  );
}

export function IndicatorMark({ size, ...props }: MarkProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 27h24" />
      <path d="M9 27V17M16 27V9M23 27v-6" />
      <path d="m6 13 6-6 5 4 8-8" opacity="0.55" />
    </svg>
  );
}

export const MODULE_MARKS: Partial<Record<ModuleKey, ComponentType<MarkProps>>> = {
  ids: IdsMark,
  dds: DdsMark,
  rituals: RitualMark,
  inspections: InspectionMark,
  managerialInspections: InspectionMark,
  deviations: DeviationMark,
  incidents: IncidentMark,
  refusalRights: RefusalMark,
  actionPlans: ActionPlanMark,
  indicators: IndicatorMark,
  leadershipRanking: RankingMark,
  leaders: LeadersMark,
  sites: SiteMark,
  sectors: SectorMark,
  reports: ReportMark,
};
