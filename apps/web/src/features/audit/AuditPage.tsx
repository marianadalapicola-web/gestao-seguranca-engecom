import { api } from '../../lib/api';
import { useServerTable } from '../../hooks/useServerTable';
import { formatDateTime } from '../../lib/format';
import type { PaginatedResponse } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { FilterBar, FilterSelect } from '../../components/ui/FilterBar';
import { Badge } from '../../components/ui/Badge';
import { useUsersDirectory } from '../../hooks/useReferenceData';

interface AuditLogEntry {
  id: string;
  action: string;
  module: string;
  recordId: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
}

const ACTION_OPTIONS = [
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'Criação' },
  { value: 'UPDATE', label: 'Alteração' },
  { value: 'DELETE', label: 'Exclusão' },
  { value: 'STATUS_CHANGE', label: 'Alteração de status' },
  { value: 'ROLE_CHANGE', label: 'Alteração de perfil' },
  { value: 'PASSWORD_CHANGE', label: 'Alteração de senha' },
  { value: 'EXPORT', label: 'Exportação de relatório' },
];

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  LOGIN: 'success',
  LOGOUT: 'neutral',
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  STATUS_CHANGE: 'warning',
  ROLE_CHANGE: 'warning',
  PASSWORD_CHANGE: 'info',
  EXPORT: 'neutral',
};

async function fetchAuditLogs(params: Record<string, string | number | undefined>): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await api.get('/audit', { params });
  return data;
}

const MODULE_LABELS: Record<string, string> = {
  auth: 'Autenticação',
  users: 'Usuários',
  rituals: 'Rituais',
  dds: 'DDS',
  inspections: 'Inspeções',
  deviations: 'Desvios',
  incidents: 'Incidentes',
  refusalRights: 'Direito de Recusa',
  managerialInspections: 'Inspeção Gerencial',
  actionPlans: 'Planos de Ação',
  indicators: 'Indicadores',
  ids: 'IDS',
  sites: 'Obras',
  sectors: 'Setores',
  attachments: 'Anexos',
  reports: 'Relatórios',
  notifications: 'Notificações',
  profile: 'Perfil',
};

export function AuditPage() {
  const table = useServerTable<AuditLogEntry>({
    queryKey: '/audit',
    fetcher: fetchAuditLogs,
    initialSortBy: 'createdAt',
    initialSortDir: 'desc',
  });
  const { data: users } = useUsersDirectory();

  const data = table.query.data;

  const columns: Column<AuditLogEntry>[] = [
    { key: 'createdAt', header: 'Data/Hora', render: (r) => formatDateTime(r.createdAt) },
    { key: 'user', header: 'Usuário', render: (r) => r.user?.name ?? 'Sistema' },
    { key: 'action', header: 'Ação', render: (r) => <Badge variant={ACTION_VARIANT[r.action] ?? 'neutral'}>{r.action}</Badge> },
    { key: 'module', header: 'Módulo', render: (r) => MODULE_LABELS[r.module] ?? r.module },
    { key: 'recordId', header: 'Registro', hideOnMobile: true, render: (r) => (r.recordId ? r.recordId.slice(0, 8) : '—') },
    { key: 'ipAddress', header: 'IP', hideOnMobile: true, render: (r) => r.ipAddress ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Trilha completa de ações realizadas no sistema — acesso exclusivo do Administrador." />
      <Card>
        <CardBody>
          <FilterBar search={table.search} onSearchChange={table.setSearch} searchPlaceholder="Pesquisar..." onClear={table.clearFilters} hasActiveFilters={table.hasActiveFilters}>
            <FilterSelect value={table.filters.action ?? ''} onChange={(v) => table.updateFilter('action', v)} options={ACTION_OPTIONS} placeholder="Ação" />
            <FilterSelect
              value={table.filters.userId ?? ''}
              onChange={(v) => table.updateFilter('userId', v)}
              options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
              placeholder="Usuário"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(r) => r.id}
            loading={table.query.isLoading}
            emptyDescription="Nenhum evento de auditoria registrado para os filtros selecionados."
          />

          {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={table.setPage} />}
        </CardBody>
      </Card>
    </div>
  );
}
