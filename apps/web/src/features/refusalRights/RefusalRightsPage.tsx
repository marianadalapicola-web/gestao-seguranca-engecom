import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface RefusalRight {
  id: string;
  date: string;
  workerName: string;
  reason: string;
  status: string;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_ANALYSIS', label: 'Em análise' },
  { value: 'TREATED', label: 'Tratado' },
  { value: 'CLOSED', label: 'Encerrado' },
];

const config: ModuleConfig<RefusalRight> = {
  key: 'refusalRights',
  apiPath: '/refusal-rights',
  title: 'Direito de Recusa',
  subtitle: 'Registros de exercício do direito de recusa por risco iminente.',
  singularLabel: 'Registro',
  searchPlaceholder: 'Pesquisar por trabalhador ou motivo...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Nenhum registro de direito de recusa até o momento.',
  getTitle: (r) => r.workerName,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'workerName', header: 'Trabalhador' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'reason', header: 'Motivo', hideOnMobile: true, render: (r) => r.reason.slice(0, 50) },
    { key: 'responsible', header: 'Responsável', hideOnMobile: true, render: (r) => r.responsible?.name ?? '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ],
  formFields: [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'workerName', label: 'Trabalhador', type: 'text', required: true },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'activity', label: 'Atividade', type: 'text' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'reason', label: 'Motivo da recusa', type: 'textarea', required: true, span: 2 },
    { name: 'identifiedRisk', label: 'Risco identificado', type: 'textarea', span: 2 },
    { name: 'measuresAdopted', label: 'Medidas adotadas', type: 'textarea', span: 2 },
  ],
};

export function RefusalRightsPage() {
  return <EntityListPage config={config} />;
}
