import { EntityListPage } from '../../components/entity/EntityListPage';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/format';
import type { ModuleConfig } from '../../components/entity/types';

interface ActionPlan {
  id: string;
  action: string;
  origin: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  sector: { name: string } | null;
  responsible: { name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'CANCELED', label: 'Cancelado' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

const config: ModuleConfig<ActionPlan> = {
  key: 'actionPlans',
  apiPath: '/action-plans',
  title: 'Planos de Ação',
  subtitle: 'Ações corretivas e preventivas com prazos e responsáveis.',
  singularLabel: 'Plano de Ação',
  searchPlaceholder: 'Pesquisar por ação ou origem...',
  defaultSortBy: 'dueDate',
  defaultSortDir: 'asc',
  emptyDescription: 'Nenhum plano de ação em aberto no momento.',
  getTitle: (r) => r.action,
  attachmentsEnabled: true,
  columns: [
    { key: 'action', header: 'Ação' },
    { key: 'origin', header: 'Origem', hideOnMobile: true, render: (r) => r.origin ?? '—' },
    { key: 'responsible', header: 'Responsável', hideOnMobile: true, render: (r) => r.responsible?.name ?? '—' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'dueDate', header: 'Prazo', sortable: true, render: (r) => formatDate(r.dueDate) },
    { key: 'priority', header: 'Prioridade', render: (r) => <StatusBadge status={r.priority} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ],
  filters: [
    { key: 'siteId', label: 'Obra', type: 'site' },
    { key: 'sectorId', label: 'Setor', type: 'sector' },
    { key: 'responsibleId', label: 'Responsável', type: 'user' },
    { key: 'priority', label: 'Prioridade', type: 'select', options: PRIORITY_OPTIONS },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  ],
  formFields: [
    { name: 'action', label: 'Ação', type: 'text', required: true, span: 2, placeholder: 'Descreva a ação a ser executada' },
    { name: 'origin', label: 'Origem', type: 'text', placeholder: 'Ex.: Desvio #123, Inspeção gerencial...' },
    { name: 'responsibleId', label: 'Responsável', type: 'user' },
    { name: 'siteId', label: 'Obra/Unidade', type: 'site' },
    { name: 'sectorId', label: 'Setor', type: 'sector' },
    { name: 'dueDate', label: 'Prazo', type: 'date' },
    { name: 'priority', label: 'Prioridade', type: 'select', options: PRIORITY_OPTIONS },
    { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { name: 'notes', label: 'Observações', type: 'textarea', span: 2 },
  ],
};

export function ActionPlansPage() {
  return <EntityListPage config={config} />;
}
