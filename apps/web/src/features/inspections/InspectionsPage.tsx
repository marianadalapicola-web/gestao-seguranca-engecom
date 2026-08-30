import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Inspection {
  id: string;
  date: string;
  type: string;
  result: string | null;
  status: string;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planejada' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CANCELED', label: 'Cancelada' },
];

const config: ModuleConfig<Inspection> = {
  key: 'inspections',
  apiPath: '/inspections',
  title: 'Inspeções',
  subtitle: 'Inspeções de segurança planejadas e realizadas.',
  singularLabel: 'Inspeção',
  searchPlaceholder: 'Pesquisar por tipo ou resultado...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Comece registrando a primeira inspeção.',
  getTitle: (r) => r.type,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'type', header: 'Tipo' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
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
    { name: 'type', label: 'Tipo de inspeção', type: 'text', required: true },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'result', label: 'Resultado', type: 'text', span: 2 },
    { name: 'notes', label: 'Observações', type: 'textarea', span: 2 },
  ],
};

export function InspectionsPage() {
  return <EntityListPage config={config} />;
}
