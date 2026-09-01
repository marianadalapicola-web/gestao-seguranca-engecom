import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Deviation {
  id: string;
  date: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  dueDate: string | null;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_TREATMENT', label: 'Em tratamento' },
  { value: 'RESOLVED', label: 'Resolvido' },
  { value: 'CANCELED', label: 'Cancelado' },
];

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

const config: ModuleConfig<Deviation> = {
  key: 'deviations',
  apiPath: '/deviations',
  title: 'Desvios de Segurança',
  subtitle: 'Registro e tratamento de desvios identificados em campo.',
  singularLabel: 'Desvio',
  searchPlaceholder: 'Pesquisar por categoria ou descrição...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Comece registrando o primeiro desvio.',
  getTitle: (r) => r.category,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'category', header: 'Categoria' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'severity', header: 'Gravidade', render: (r) => <StatusBadge status={r.severity} /> },
    { key: 'responsible', header: 'Responsável', hideOnMobile: true, render: (r) => r.responsible?.name ?? '—' },
    { key: 'dueDate', header: 'Prazo', hideOnMobile: true, render: (r) => formatDate(r.dueDate) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
    { key: 'severity', label: 'Gravidade', type: 'select', options: SEVERITY_OPTIONS },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ],
  formFields: [
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'category', label: 'Categoria', type: 'text', required: true, placeholder: 'Ex.: Uso de EPI, condição insegura...' },
    { name: 'severity', label: 'Gravidade', type: 'select', options: SEVERITY_OPTIONS, required: true },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'dueDate', label: 'Prazo', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'description', label: 'Descrição do desvio', type: 'textarea', required: true, span: 2 },
  ],
};

export function DeviationsPage() {
  return <EntityListPage config={config} />;
}
