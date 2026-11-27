import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface Ritual {
  id: string;
  date: string;
  type: string;
  theme: string | null;
  location: string | null;
  status: string;
  participantsCount: number | null;
  site: { name: string } | null;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planejado' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CANCELED', label: 'Cancelado' },
];

const config: ModuleConfig<Ritual> = {
  key: 'rituals',
  apiPath: '/rituals',
  title: 'Rituais de Segurança',
  subtitle: 'Registro dos rituais de segurança realizados nas obras e setores.',
  singularLabel: 'Ritual',
  searchPlaceholder: 'Pesquisar por tema, tipo ou local...',
  defaultSortBy: 'date',
  defaultSortDir: 'desc',
  emptyDescription: 'Comece registrando o primeiro ritual de segurança.',
  getTitle: (r) => r.theme || r.type,
  attachmentsEnabled: true,
  columns: [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'type', header: 'Tipo' },
    { key: 'theme', header: 'Tema', hideOnMobile: true, render: (r) => r.theme ?? '—' },
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
    { name: 'time', label: 'Horário', type: 'time' },
    { name: 'type', label: 'Tipo de ritual', type: 'text', required: true, placeholder: 'Ex.: Diálogo de segurança, treinamento...' },
    { name: 'theme', label: 'Tema', type: 'text' },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'location', label: 'Local', type: 'text' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'participantsCount', label: 'Nº de participantes', type: 'number' },
    { name: 'participants', label: 'Participantes', type: 'textarea', span: 2, placeholder: 'Nomes dos participantes' },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'notes', label: 'Observações', type: 'textarea', span: 2 },
  ],
};

export function RitualsPage() {
  return <EntityListPage config={config} />;
}
