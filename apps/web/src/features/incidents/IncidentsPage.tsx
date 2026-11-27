import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Incident {
  id: string;
  date: string;
  type: string;
  description: string;
  status: string;
  sector: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'INVESTIGATING', label: 'Em investigação' },
  { value: 'CLOSED', label: 'Encerrado' },
];

const config: ModuleConfig<Incident> = {
  key: 'incidents',
  apiPath: '/incidents',
  title: 'Incidentes',
  subtitle: 'Registro de incidentes e acidentes de trabalho.',
  singularLabel: 'Incidente',
  searchPlaceholder: 'Pesquisar por tipo ou descrição...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Nenhum incidente registrado até o momento.',
  getTitle: (r) => r.type,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'type', header: 'Tipo' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'description', header: 'Descrição', hideOnMobile: true, render: (r) => r.description.slice(0, 60) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ],
  formFields: [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'time', label: 'Horário', type: 'time' },
    { name: 'type', label: 'Tipo de incidente', type: 'text', required: true },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true, span: 2 },
    { name: 'involved', label: 'Envolvidos', type: 'textarea' },
    { name: 'consequences', label: 'Consequências', type: 'textarea' },
    { name: 'cause', label: 'Causa', type: 'textarea' },
    { name: 'actionsTaken', label: 'Ações tomadas', type: 'textarea', span: 2 },
  ],
};

export function IncidentsPage() {
  return <EntityListPage config={config} />;
}
