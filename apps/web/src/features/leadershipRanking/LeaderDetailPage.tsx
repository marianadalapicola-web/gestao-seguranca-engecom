import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ThumbsUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EvolutionChart } from '../../components/charts/EvolutionChart';
import { fetchLeaderDetail, PERIOD_OPTIONS, SCORE_COMPONENT_LABELS, type PeriodPreset, type ScoreComponentKey } from './api';
import { classificationVariant, evolutionIcon, evolutionLabel, medalFor } from './utils';

export function LeaderDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodPreset>('month');

  const detailQuery = useQuery({
    queryKey: ['leadership-ranking', 'detail', userId, period],
    queryFn: () => fetchLeaderDetail(userId!, { period }),
    enabled: Boolean(userId),
  });

  const breakdownEntries = useMemo(() => {
    if (!detailQuery.data) return [];
    return (Object.entries(detailQuery.data.scoreBreakdown) as Array<[ScoreComponentKey, { raw: number | null; score: number | null; weight: number }]>).filter(
      ([, c]) => c.score !== null
    );
  }, [detailQuery.data]);

  const strengths = useMemo(() => [...breakdownEntries].sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0)).slice(0, 2), [breakdownEntries]);
  const improvements = useMemo(
    () => [...breakdownEntries].sort((a, b) => (a[1].score ?? 0) - (b[1].score ?? 0)).slice(0, 2).filter(([, c]) => (c.score ?? 0) < 80),
    [breakdownEntries]
  );

  if (detailQuery.isLoading) return <Spinner label="Carregando desempenho do líder..." />;
  if (!detailQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ranking-lideranca')}>
          <ArrowLeft size={14} /> Voltar ao ranking
        </Button>
        <Card>
          <CardBody className="text-center py-10 text-sm text-[var(--color-ink-500)]">
            Líder não encontrado ou sem participação no ranking deste período.
          </CardBody>
        </Card>
      </div>
    );
  }

  const entry = detailQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" className="self-start" onClick={() => navigate('/ranking-lideranca')}>
        <ArrowLeft size={14} /> Voltar ao ranking
      </Button>

      <PageHeader
        title={entry.name}
        subtitle={entry.sectorNames.join(', ') || 'Sem setor vinculado'}
        actions={
          <Select value={period} onChange={(e) => setPeriod(e.target.value as PeriodPreset)} className="sm:w-40">
            {PERIOD_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide">Posição atual</p>
            <p className="text-2xl font-semibold text-[var(--color-ink-900)] mt-1">
              {medalFor(entry.position) ?? `${entry.position}º`}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide">Pontuação geral</p>
            <p className="text-2xl font-semibold text-[var(--color-brand-700)] mt-1">{entry.score}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide">Classificação</p>
            <div className="mt-2"><Badge variant={classificationVariant(entry.classification)}>{entry.classification}</Badge></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide">Evolução</p>
            <p className="text-sm font-medium text-[var(--color-ink-900)] mt-2">
              {evolutionIcon(entry.evolution)} {evolutionLabel(entry.evolution, entry.positionDelta)}
            </p>
            {entry.previousScore !== null && (
              <p className="text-xs text-[var(--color-ink-500)] mt-0.5">Pontuação anterior: {entry.previousScore}</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Evolução da pontuação" subtitle="Fechamento mensal dos últimos 6 meses." />
          <CardBody>
            {entry.history.every((p) => p.score === null) ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-10">Ainda não há histórico suficiente para exibir a evolução.</p>
            ) : (
              <EvolutionChart data={entry.history} series={[{ key: 'score', label: 'Pontuação', color: '#1f5fa3' }]} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Composição da pontuação" subtitle="Peso de cada indicador no cálculo." />
          <CardBody className="flex flex-col gap-3">
            {breakdownEntries.length === 0 && <p className="text-sm text-[var(--color-ink-500)]">Sem dados aplicáveis neste período.</p>}
            {breakdownEntries.map(([key, c]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--color-ink-700)]">{SCORE_COMPONENT_LABELS[key]}</span>
                  <span className="font-medium text-[var(--color-ink-900)]">{c.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--color-brand-600)]" style={{ width: `${Math.min(100, c.score ?? 0)}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">DDS realizados</p><p className="text-xl font-semibold text-[var(--color-ink-900)] mt-1">{entry.metrics.ddsCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">Inspeções</p><p className="text-xl font-semibold text-[var(--color-ink-900)] mt-1">{entry.metrics.inspectionsCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">Desvios encontrados</p><p className="text-xl font-semibold text-[var(--color-ink-900)] mt-1">{entry.metrics.deviationsFound}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">% ações concluídas no prazo</p><p className="text-xl font-semibold text-[var(--color-ink-900)] mt-1">{entry.metrics.actionPlansOnTimeRate}%</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">Ações vencidas</p><p className="text-xl font-semibold text-[var(--color-danger-700)] mt-1">{entry.metrics.actionPlansOverdue}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-[var(--color-ink-500)]">Incidentes</p><p className="text-xl font-semibold text-[var(--color-ink-900)] mt-1">{entry.metrics.incidentsCount}</p></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Pontos positivos" icon={<ThumbsUp size={16} />} />
          <CardBody className="flex flex-col gap-2">
            {strengths.length === 0 && <p className="text-sm text-[var(--color-ink-500)]">Sem destaques neste período.</p>}
            {strengths.map(([key, c]) => (
              <p key={key} className="text-sm text-[var(--color-ink-700)]">• {SCORE_COMPONENT_LABELS[key]} — nota {c.score}</p>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Pontos de melhoria" icon={<TrendingDown size={16} />} />
          <CardBody className="flex flex-col gap-2">
            {improvements.length === 0 && <p className="text-sm text-[var(--color-ink-500)]">Nenhum ponto crítico identificado neste período.</p>}
            {improvements.map(([key, c]) => (
              <p key={key} className="text-sm text-[var(--color-ink-700)]">• {SCORE_COMPONENT_LABELS[key]} — nota {c.score}</p>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
