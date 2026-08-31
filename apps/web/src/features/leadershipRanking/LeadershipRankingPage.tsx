import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Search, Scale, ChevronRight, Minus } from 'lucide-react';
import clsx from 'clsx';
import { useSites, useSectors } from '../../hooks/useReferenceData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Select, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  fetchLeadershipRanking,
  PERIOD_OPTIONS,
  SCORE_COMPONENT_LABELS,
  type LeaderRankingEntry,
  type PeriodPreset,
  type ScoreComponentKey,
} from './api';
import { classificationVariant, evolutionIcon, evolutionLabel, medalFor } from './utils';

interface Filters {
  period: PeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  siteId?: string;
  sectorId?: string;
}

const COMPARE_METRICS: Array<{ key: ScoreComponentKey; format: (e: LeaderRankingEntry) => string }> = [
  { key: 'dds', format: (e) => String(e.metrics.ddsCount) },
  { key: 'inspections', format: (e) => String(e.metrics.inspectionsCount) },
  { key: 'deviationsTreated', format: (e) => `${e.metrics.deviationsResolutionRate}% (${e.metrics.deviationsResolved}/${e.metrics.deviationsFound})` },
  { key: 'actionPlansOnTime', format: (e) => `${e.metrics.actionPlansOnTimeRate}% (${e.metrics.actionPlansOnTime}/${e.metrics.actionPlansDue})` },
  { key: 'incidents', format: (e) => String(e.metrics.incidentsCount) },
  { key: 'inspectionResult', format: (e) => (e.metrics.managerialInspectionAvgPercentage !== null ? `${e.metrics.managerialInspectionAvgPercentage}%` : '—') },
];

export function LeadershipRankingPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({ period: 'month' });
  const [search, setSearch] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: sites } = useSites();
  const { data: sectors } = useSectors(filters.siteId);

  const rankingQuery = useQuery({
    queryKey: ['leadership-ranking', filters],
    queryFn: () => fetchLeadershipRanking(filters),
  });

  const items = rankingQuery.data?.items ?? [];
  const filteredItems = useMemo(
    () => (search.trim() ? items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase())) : items),
    [items, search]
  );
  const top3 = items.slice(0, 3);
  const comparisonEntries = items.filter((i) => selected.includes(i.userId));

  function toggleSelected(userId: string) {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : prev.length < 4 ? [...prev, userId] : prev));
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ranking de Liderança"
        subtitle="Pontuação automática das lideranças com base em dados reais de DDS, inspeções, desvios, incidentes e planos de ação."
      />

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.period}
            onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value as PeriodPreset }))}
            className="sm:w-40"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          {filters.period === 'custom' && (
            <div className="flex items-center gap-2">
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
          )}
          <Select
            value={filters.siteId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, siteId: e.target.value || undefined, sectorId: undefined }))}
            className="sm:w-48"
          >
            <option value="">Todas as obras</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select
            value={filters.sectorId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, sectorId: e.target.value || undefined }))}
            className="sm:w-48"
          >
            <option value="">Ranking geral (todos os setores)</option>
            {(sectors ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar líder..." className="pl-8" />
          </div>
          <Button
            variant={compareMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode((v) => !v);
              setSelected([]);
            }}
          >
            <Scale size={14} /> Comparar líderes
          </Button>
        </CardBody>
      </Card>

      {rankingQuery.isLoading ? (
        <Spinner label="Calculando ranking..." />
      ) : !rankingQuery.data?.hasSufficientData ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Trophy size={22} />}
              title="Ainda não existem dados suficientes para gerar o ranking deste período."
              description="Registre DDS, inspeções, desvios, planos de ação ou incidentes para que a pontuação das lideranças seja calculada automaticamente."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((entry) => (
                <Card
                  key={entry.userId}
                  className="cursor-pointer transition-shadow hover:[box-shadow:var(--shadow-elevated)]"
                  onClick={() => navigate(`/ranking-lideranca/${entry.userId}`)}
                >
                  <CardBody className="flex items-center gap-3">
                    <span className="text-3xl leading-none shrink-0">{medalFor(entry.position)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink-900)] truncate">{entry.name}</p>
                      <p className="text-xs text-[var(--color-ink-500)] truncate">{entry.sectorNames.join(', ') || 'Sem setor'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-lg font-semibold text-[var(--color-brand-700)]">{entry.score}</span>
                        <Badge variant={classificationVariant(entry.classification)}>{entry.classification}</Badge>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {compareMode && (
            <Card>
              <CardHeader
                title="Comparação entre líderes"
                subtitle={selected.length < 2 ? 'Selecione ao menos dois líderes na lista abaixo para comparar.' : `Comparando ${selected.length} líderes.`}
              />
              {comparisonEntries.length >= 2 && (
                <CardBody className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm border-collapse min-w-[480px]">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2 px-3">Indicador</th>
                        {comparisonEntries.map((e) => (
                          <th key={e.userId} className="text-left font-medium text-[var(--color-ink-900)] text-xs py-2 px-3">{e.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[var(--color-border)]">
                        <td className="py-2 px-3 font-medium text-[var(--color-ink-700)]">Pontuação geral</td>
                        {comparisonEntries.map((e) => (
                          <td key={e.userId} className="py-2 px-3 font-semibold text-[var(--color-brand-700)]">{e.score}</td>
                        ))}
                      </tr>
                      {COMPARE_METRICS.map((metric) => (
                        <tr key={metric.key} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="py-2 px-3 text-[var(--color-ink-700)]">{SCORE_COMPONENT_LABELS[metric.key]}</td>
                          {comparisonEntries.map((e) => (
                            <td key={e.userId} className="py-2 px-3 text-[var(--color-ink-900)]">{metric.format(e)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              )}
            </Card>
          )}

          <Card>
            <CardHeader title="Classificação completa" subtitle={`${filteredItems.length} líder(es) no período selecionado.`} />
            <CardBody className="p-0 sm:p-5">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm border-collapse min-w-[860px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {compareMode && <th className="w-8"></th>}
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">#</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Líder</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Setor/Área</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Pontuação</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">DDS</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Inspeções</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Desvios</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Planos no prazo</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Incidentes</th>
                      <th className="text-left font-medium text-[var(--color-ink-500)] text-xs uppercase tracking-wide py-2.5 px-3">Evolução</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((entry) => (
                      <tr
                        key={entry.userId}
                        onClick={() => !compareMode && navigate(`/ranking-lideranca/${entry.userId}`)}
                        className={clsx('border-b border-[var(--color-border)] last:border-0', !compareMode && 'cursor-pointer hover:bg-[var(--color-brand-50)]')}
                      >
                        {compareMode && (
                          <td className="px-3">
                            <input type="checkbox" checked={selected.includes(entry.userId)} onChange={() => toggleSelected(entry.userId)} onClick={(e) => e.stopPropagation()} />
                          </td>
                        )}
                        <td className="py-2.5 px-3 font-medium text-[var(--color-ink-900)]">
                          {medalFor(entry.position) ?? entry.position}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.name}</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-500)]">{entry.sectorNames.join(', ') || '—'}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-brand-700)]">{entry.score}</span>
                            <Badge variant={classificationVariant(entry.classification)}>{entry.classification}</Badge>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.metrics.ddsCount}</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.metrics.inspectionsCount}</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.metrics.deviationsFound}</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.metrics.actionPlansOnTimeRate}%</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">{entry.metrics.incidentsCount}</td>
                        <td className="py-2.5 px-3 text-[var(--color-ink-900)]">
                          <span title={evolutionLabel(entry.evolution, entry.positionDelta)}>{evolutionIcon(entry.evolution)}</span>
                        </td>
                        <td className="px-3 text-[var(--color-ink-400)]">{!compareMode && <ChevronRight size={14} />}</td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-sm text-[var(--color-ink-500)]">Nenhum líder encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden flex flex-col divide-y divide-[var(--color-border)]">
                {filteredItems.map((entry) => (
                  <div
                    key={entry.userId}
                    className="p-4 flex flex-col gap-2"
                    onClick={() => !compareMode && navigate(`/ranking-lideranca/${entry.userId}`)}
                  >
                    <div className="flex items-center gap-2">
                      {compareMode && (
                        <input type="checkbox" checked={selected.includes(entry.userId)} onChange={() => toggleSelected(entry.userId)} />
                      )}
                      <span className="text-xl leading-none">{medalFor(entry.position) ?? <Minus size={14} className="inline text-[var(--color-ink-400)]" />}</span>
                      {!medalFor(entry.position) && <span className="text-xs font-medium text-[var(--color-ink-500)]">{entry.position}º</span>}
                      <span className="text-sm font-semibold text-[var(--color-ink-900)] flex-1 truncate">{entry.name}</span>
                      <span title={evolutionLabel(entry.evolution, entry.positionDelta)}>{evolutionIcon(entry.evolution)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-500)]">{entry.sectorNames.join(', ') || 'Sem setor'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-[var(--color-brand-700)]">{entry.score}</span>
                      <Badge variant={classificationVariant(entry.classification)}>{entry.classification}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-[var(--color-ink-700)]">
                      <span>DDS: <b>{entry.metrics.ddsCount}</b></span>
                      <span>Inspeções: <b>{entry.metrics.inspectionsCount}</b></span>
                      <span>Desvios: <b>{entry.metrics.deviationsFound}</b></span>
                      <span>Planos no prazo: <b>{entry.metrics.actionPlansOnTimeRate}%</b></span>
                      <span>Incidentes: <b>{entry.metrics.incidentsCount}</b></span>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <p className="py-8 text-center text-sm text-[var(--color-ink-500)]">Nenhum líder encontrado.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
