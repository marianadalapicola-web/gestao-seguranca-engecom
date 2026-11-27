import { Module } from '../../config/permissions';

export interface ReportColumn {
  header: string;
  path: string; // dot-path into the record, e.g. "sector.name"
  format?: (value: unknown) => string;
  /** Relative width weight (default 1) — wider for free-text columns, narrower for codes/dates. */
  width?: number;
}

export interface ReportModuleConfig {
  module: Module;
  model: string;
  title: string;
  dateField?: string;
  include?: Record<string, unknown>;
  columns: ReportColumn[];
}

const dateFmt = (v: unknown) => (v ? new Date(v as string).toLocaleDateString('pt-BR') : '');
const personSelect = { id: true, name: true, email: true } as const;

// Mesmos rótulos usados no Badge/StatusBadge do frontend (components/ui/Badge.tsx)
// — o relatório precisa mostrar exatamente o que a pessoa já vê na tela, não o
// valor bruto do enum salvo no banco.
export const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planejado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  PENDING: 'Pendente',
  CANCELED: 'Cancelado',
  OPEN: 'Aberto',
  IN_TREATMENT: 'Em tratamento',
  RESOLVED: 'Resolvido',
  INVESTIGATING: 'Em investigação',
  CLOSED: 'Encerrado',
  IN_ANALYSIS: 'Em análise',
  TREATED: 'Tratado',
  OVERDUE: 'Vencido',
  ACTIVE: 'Ativo',
  BLOCKED: 'Bloqueado',
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

const statusFmt = (v: unknown) => (v ? (STATUS_LABELS[v as string] ?? String(v)) : '');

export const REPORT_MODULES: Record<string, ReportModuleConfig> = {
  rituals: {
    module: 'rituals',
    model: 'ritual',
    title: 'Rituais de Segurança',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Tipo', path: 'type', width: 1 },
      { header: 'Tema', path: 'theme', width: 1.4 },
      { header: 'Obra', path: 'site.name', width: 1 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Responsável', path: 'responsible.name', width: 1.2 },
      { header: 'Participantes', path: 'participantsCount', width: 0.8 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
    ],
  },
  dds: {
    module: 'dds',
    model: 'dds',
    title: 'Diálogos Diários de Segurança (DDS)',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Tema', path: 'theme', width: 1.6 },
      { header: 'Obra', path: 'site.name', width: 1 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Responsável', path: 'responsible.name', width: 1.2 },
      { header: 'Participantes', path: 'participantsCount', width: 0.8 },
    ],
  },
  inspections: {
    module: 'inspections',
    model: 'inspection',
    title: 'Inspeções',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Tipo', path: 'type', width: 1.1 },
      { header: 'Obra', path: 'site.name', width: 1 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Responsável', path: 'responsible.name', width: 1.2 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
      { header: 'Resultado', path: 'result', width: 1.4 },
    ],
  },
  deviations: {
    module: 'deviations',
    model: 'deviation',
    title: 'Desvios de Segurança',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Categoria', path: 'category', width: 1.1 },
      { header: 'Gravidade', path: 'severity', format: statusFmt, width: 0.8 },
      { header: 'Obra', path: 'site.name', width: 1 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Responsável', path: 'responsible.name', width: 1.2 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
      { header: 'Prazo', path: 'dueDate', format: dateFmt, width: 0.7 },
    ],
  },
  incidents: {
    module: 'incidents',
    model: 'incident',
    title: 'Incidentes',
    dateField: 'date',
    include: { site: true, sector: true },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Tipo', path: 'type', width: 1.3 },
      { header: 'Obra', path: 'site.name', width: 1 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
    ],
  },
  refusalRights: {
    module: 'refusalRights',
    model: 'refusalRight',
    title: 'Direito de Recusa',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt, width: 0.7 },
      { header: 'Trabalhador', path: 'workerName', width: 1.3 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Motivo', path: 'reason', width: 1.8 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
    ],
  },
  actionPlans: {
    module: 'actionPlans',
    model: 'actionPlan',
    title: 'Planos de Ação',
    dateField: 'dueDate',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Ação', path: 'action', width: 2 },
      { header: 'Origem', path: 'origin', width: 1 },
      { header: 'Responsável', path: 'responsible.name', width: 1.2 },
      { header: 'Setor', path: 'sector.name', width: 1 },
      { header: 'Prazo', path: 'dueDate', format: dateFmt, width: 0.7 },
      { header: 'Prioridade', path: 'priority', format: statusFmt, width: 0.8 },
      { header: 'Status', path: 'status', format: statusFmt, width: 0.9 },
    ],
  },
};

export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);
}
