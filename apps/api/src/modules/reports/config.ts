import { Module } from '../../config/permissions';

export interface ReportColumn {
  header: string;
  path: string; // dot-path into the record, e.g. "sector.name"
  format?: (value: unknown) => string;
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

export const REPORT_MODULES: Record<string, ReportModuleConfig> = {
  rituals: {
    module: 'rituals',
    model: 'ritual',
    title: 'Rituais de Segurança',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Tipo', path: 'type' },
      { header: 'Tema', path: 'theme' },
      { header: 'Obra', path: 'site.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Responsável', path: 'responsible.name' },
      { header: 'Participantes', path: 'participantsCount' },
      { header: 'Status', path: 'status' },
    ],
  },
  dds: {
    module: 'dds',
    model: 'dds',
    title: 'Diálogos Diários de Segurança (DDS)',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Tema', path: 'theme' },
      { header: 'Obra', path: 'site.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Responsável', path: 'responsible.name' },
      { header: 'Participantes', path: 'participantsCount' },
    ],
  },
  inspections: {
    module: 'inspections',
    model: 'inspection',
    title: 'Inspeções',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Tipo', path: 'type' },
      { header: 'Obra', path: 'site.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Responsável', path: 'responsible.name' },
      { header: 'Status', path: 'status' },
      { header: 'Resultado', path: 'result' },
    ],
  },
  deviations: {
    module: 'deviations',
    model: 'deviation',
    title: 'Desvios de Segurança',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Categoria', path: 'category' },
      { header: 'Gravidade', path: 'severity' },
      { header: 'Obra', path: 'site.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Responsável', path: 'responsible.name' },
      { header: 'Status', path: 'status' },
      { header: 'Prazo', path: 'dueDate', format: dateFmt },
    ],
  },
  incidents: {
    module: 'incidents',
    model: 'incident',
    title: 'Incidentes',
    dateField: 'date',
    include: { site: true, sector: true },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Tipo', path: 'type' },
      { header: 'Obra', path: 'site.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Status', path: 'status' },
    ],
  },
  refusalRights: {
    module: 'refusalRights',
    model: 'refusalRight',
    title: 'Direito de Recusa',
    dateField: 'date',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Data', path: 'date', format: dateFmt },
      { header: 'Trabalhador', path: 'workerName' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Motivo', path: 'reason' },
      { header: 'Status', path: 'status' },
    ],
  },
  actionPlans: {
    module: 'actionPlans',
    model: 'actionPlan',
    title: 'Planos de Ação',
    dateField: 'dueDate',
    include: { site: true, sector: true, responsible: { select: personSelect } },
    columns: [
      { header: 'Ação', path: 'action' },
      { header: 'Origem', path: 'origin' },
      { header: 'Responsável', path: 'responsible.name' },
      { header: 'Setor', path: 'sector.name' },
      { header: 'Prazo', path: 'dueDate', format: dateFmt },
      { header: 'Prioridade', path: 'priority' },
      { header: 'Status', path: 'status' },
    ],
  },
};

export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);
}
