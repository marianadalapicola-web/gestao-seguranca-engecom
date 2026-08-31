import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Megaphone,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Siren,
  HandMetal,
  Gauge,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSites, useSectors, useUsersDirectory } from '../../hooks/useReferenceData';
import { fetchDashboardBySector, fetchDashboardEvolution, fetchDashboardSummary, type DashboardFilters } from './api';
import { fetchLeadershipRankingSummary } from '../leadershipRanking/api';
import { classificationVariant, medalFor } from '../leadershipRanking/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FilterSelect } from '../../components/ui/FilterBar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EvolutionChart } from '../../components/charts/EvolutionChart';
import { SectorBarChart } from '../../components/charts/SectorBarChart';

export function DashboardPage() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({});

  const { data: sites } = useSites();
  const { data: sectors } = useSectors(filters.siteId);
  const { data: users } = useUsersDirectory();

  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () => fetchDashboardSummary(filters),
  });

  const evolutionQuery = useQuery({
    queryKey: ['dashboard', 'evolution', filters],
    queryFn: () => fetchDashboardEvolution(filters, 6),
  });

  const sectorQuery = useQuery({
    queryKey: ['dashboard', 'by-sector', filters],
    queryFn: () => fetchDashboardBySector(filters),
  });

  const rankingSummaryQuery = useQuery({
    queryKey: ['leadership-ranking', 'summary', 'dashboard'],
    queryFn: () => fetchLeadershipRankingSummary({ period: 'month' }),
    enabled: can('leadershipRanking', 'read'),
  });

  const sectorChartData = useMemo(
    () => (sectorQuery.data ?? []).slice(0, 8).map((s) => ({ name: s.sectorName, value: s.deviations })),
    [sectorQuery.data]
  );

  const summary = summaryQuery.data;

  const quickActions = [
    { label: 'Novo DDS', module: 'dds' as const, path: '/dds', icon: MessageSquare },
    { label: 'Novo Ritual', module: 'rituals' as const, path: '/rituais', icon: Megaphone },
    { label: 'Nova Inspeção', module: 'inspections' as const, path: '/inspecoes', icon: ClipboardCheck },
    { label: 'Novo Desvio', module: 'deviations' as const, path: '/desvios', icon: AlertTriangle },
  ].filter((action) => can(action.module, 'create'));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Olá, ${user?.name.split(' ')[0]}`}
        subtitle={`Perfil: ${user?.roleLabel} · Painel geral de segurança do trabalho`}
        actions={quickActions.map((action) => (
          <Button key={action.path} variant="outline" size="sm" onClick={() => navigate(action.path)}>
            <Plus size={14} /> {action.label}
          </Button>
        ))}
      />

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={filters.siteId ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, siteId: v || undefined, sectorId: undefined }))}
            options={(sites ?? []).map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Todas as obras"
          />
          <FilterSelect
            value={filters.sectorId ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, sectorId: v || undefined }))}
            options={(sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Todos os setores"
          />
          <FilterSelect
            value={filters.responsibleId ?? ''}
            onChange={(v) => setFilters((f) => ({ ...f, responsibleId: v || undefined }))}
            options={(users ?? []).map((u) => ({ value: u.id, label: u.name }))}
            placeholder="Todos os responsáveis"
          />
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-[var(--color-ink-500)]">Período:</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
              className="rounded-md border border-[var(--color-border-strong)] px-2 py-1.5 text-xs"
            />
            <span className="text-[var(--color-ink-400)] text-xs">até</span>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
              className="rounded-md border border-[var(--color-border-strong)] px-2 py-1.5 text-xs"
            />
          </div>
        </CardBody>
      </Card>

      {summaryQuery.isLoading ? (
        <Spinner label="Carregando indicadores..." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="IDS Atual"
            value={summary?.ids?.value ?? '—'}
            icon={<Gauge size={16} />}
            tone="brand"
            hint={summary?.ids ? `Meta: ${summary.ids.target ?? '—'}` : 'Não configurado'}
          />
          <StatCard label="DDS Realizados" value={summary?.dds ?? 0} icon={<MessageSquare size={16} />} tone="brand" />
          <StatCard label="Rituais Realizados" value={summary?.rituals ?? 0} icon={<Megaphone size={16} />} tone="brand" />
          <StatCard label="Inspeções Realizadas" value={summary?.inspections ?? 0} icon={<ClipboardCheck size={16} />} tone="brand" />
          <StatCard
            label="% Conformidade"
            value={summary?.compliancePercentage !== null && summary?.compliancePercentage !== undefined ? `${summary.compliancePercentage}%` : '—'}
            icon={<CheckCircle2 size={16} />}
            tone="success"
          />
          <StatCard label="Desvios Encontrados" value={summary?.deviations.total ?? 0} icon={<AlertTriangle size={16} />} tone="warning" />
          <StatCard label="Desvios Tratados" value={summary?.deviations.resolved ?? 0} icon={<CheckCircle2 size={16} />} tone="success" />
          <StatCard label="Planos em Aberto" value={summary?.actionPlans.open ?? 0} icon={<ListChecks size={16} />} tone="brand" />
          <StatCard label="Planos Vencidos" value={summary?.actionPlans.overdue ?? 0} icon={<ListChecks size={16} />} tone="danger" />
          <StatCard label="Incidentes" value={summary?.incidents ?? 0} icon={<Siren size={16} />} tone="danger" />
          <StatCard label="Direito de Recusa" value={summary?.refusalRights ?? 0} icon={<HandMetal size={16} />} tone="neutral" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Evolução Mensal" subtitle="DDS, rituais, inspeções e desvios nos últimos 6 meses" />
          <CardBody>
            {evolutionQuery.isLoading ? (
              <Spinner />
            ) : (
              <EvolutionChart
                data={evolutionQuery.data ?? []}
                series={[
                  { key: 'dds', label: 'DDS', color: '#1f5fa3' },
                  { key: 'rituals', label: 'Rituais', color: '#3b7fc4' },
                  { key: 'inspections', label: 'Inspeções', color: '#16a34a' },
                  { key: 'deviations', label: 'Desvios', color: '#dc2626' },
                ]}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Desvios por Setor" subtitle="Setores com mais desvios registrados" />
          <CardBody>
            {sectorQuery.isLoading ? (
              <Spinner />
            ) : sectorChartData.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-10">Não há dados de setores para este período.</p>
            ) : (
              <SectorBarChart data={sectorChartData} />
            )}
          </CardBody>
        </Card>
      </div>

      {can('leadershipRanking', 'read') && (
        <Card>
          <CardHeader
            title="🏆 Ranking de Liderança"
            subtitle="Top 3 lideranças do mês, com base em dados reais de segurança."
            actions={
              <Button variant="outline" size="sm" onClick={() => navigate('/ranking-lideranca')}>
                Ver ranking completo
              </Button>
            }
          />
          <CardBody>
            {rankingSummaryQuery.isLoading ? (
              <Spinner />
            ) : !rankingSummaryQuery.data?.hasSufficientData ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-6">
                Ainda não existem dados suficientes para gerar o ranking deste período.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {rankingSummaryQuery.data.top.map((entry) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 cursor-pointer hover:bg-[var(--color-brand-50)]"
                      onClick={() => navigate(`/ranking-lideranca/${entry.userId}`)}
                    >
                      <span className="text-2xl leading-none shrink-0">{medalFor(entry.position)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--color-ink-900)] truncate">{entry.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-[var(--color-brand-700)]">{entry.score}</span>
                          <Badge variant={classificationVariant(entry.classification)}>{entry.classification}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {rankingSummaryQuery.data.bestEvolution && (
                  <p className="text-xs text-[var(--color-ink-500)]">
                    Melhor evolução do período: <b className="text-[var(--color-ink-700)]">{rankingSummaryQuery.data.bestEvolution.name}</b>{' '}
                    (+{rankingSummaryQuery.data.bestEvolution.delta} pontos)
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
