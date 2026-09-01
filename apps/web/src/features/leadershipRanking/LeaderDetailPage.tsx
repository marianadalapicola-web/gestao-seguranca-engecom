import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Plus, ThumbsUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { EvolutionChart } from '../../components/charts/EvolutionChart';
import { fetchLeaderDetail, PERIOD_OPTIONS, SCORE_COMPONENT_LABELS, type PeriodPreset, type ScoreComponentKey } from './api';
import { classificationVariant, evolutionIcon, evolutionLabel, medalFor } from './utils';
import { getLeader, listLeaderEvaluations, createLeaderEvaluation } from '../leaders/api';

const emptyEvaluationForm = { leadershipScore: 8, communicationScore: 8, safetyCommitmentScore: 8, notes: '' };

export function LeaderDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodPreset>('month');
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalForm, setEvalForm] = useState(emptyEvaluationForm);

  const isOwnProfile = user?.id === userId;
  const canReadProfile = can('leaders', 'read');
  // A liderança só pode ler avaliações no próprio perfil, nunca no de um
  // colega — o backend também recusa, isso só evita disparar a consulta e
  // mostrar a seção à toa em quem não é dono do perfil.
  const canReadEvaluations = can('leaderEvaluations', 'read') && (user?.role !== 'LEADERSHIP' || isOwnProfile);
  const canCreateEvaluations = can('leaderEvaluations', 'create');

  const detailQuery = useQuery({
    queryKey: ['leadership-ranking', 'detail', userId, period],
    queryFn: () => fetchLeaderDetail(userId!, { period }),
    enabled: Boolean(userId),
  });

  const profileQuery = useQuery({
    queryKey: ['leaders', 'detail', userId],
    queryFn: () => getLeader(userId!),
    enabled: Boolean(userId) && canReadProfile,
  });

  const evaluationsQuery = useQuery({
    queryKey: ['leaders', 'evaluations', userId],
    queryFn: () => listLeaderEvaluations(userId!),
    enabled: Boolean(userId) && canReadEvaluations,
  });

  const createEvaluationMutation = useMutation({
    mutationFn: () => createLeaderEvaluation(userId!, { ...evalForm, notes: evalForm.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaders', 'evaluations', userId] });
      queryClient.invalidateQueries({ queryKey: ['leadership-ranking'] });
      showToast('Avaliação registrada com sucesso.', 'success');
      setEvalModalOpen(false);
      setEvalForm(emptyEvaluationForm);
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível registrar a avaliação.'), 'error'),
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
        subtitle={[
          profileQuery.data?.position,
          entry.sectorNames.join(', ') || 'Sem setor vinculado',
          profileQuery.data ? (profileQuery.data.hasSystemAccess ? 'Com acesso ao sistema' : 'Sem acesso ao sistema') : null,
        ]
          .filter(Boolean)
          .join(' · ')}
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

      {canReadEvaluations && (
        <Card>
          <CardHeader
            title="Avaliações"
            subtitle="Avaliação manual e qualitativa, complementar à pontuação automática acima."
            icon={<ClipboardList size={16} />}
            actions={
              canCreateEvaluations ? (
                <Button size="sm" onClick={() => setEvalModalOpen(true)}>
                  <Plus size={14} /> Nova avaliação
                </Button>
              ) : undefined
            }
          />
          <CardBody className="flex flex-col gap-4">
            {evaluationsQuery.isLoading ? (
              <Spinner />
            ) : (evaluationsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-6">Ainda não há avaliações registradas para este líder.</p>
            ) : (
              (evaluationsQuery.data ?? []).map((ev) => (
                <div key={ev.id} className="border border-[var(--color-border)] rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-xs text-[var(--color-ink-500)]">
                      {formatDate(ev.date)} · avaliado por <b className="text-[var(--color-ink-700)]">{ev.evaluator.name}</b>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                    <div>
                      <p className="text-xs text-[var(--color-ink-500)]">Liderança</p>
                      <p className="font-semibold text-[var(--color-ink-900)]">{ev.leadershipScore}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-ink-500)]">Comunicação</p>
                      <p className="font-semibold text-[var(--color-ink-900)]">{ev.communicationScore}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-ink-500)]">Comprometimento com segurança</p>
                      <p className="font-semibold text-[var(--color-ink-900)]">{ev.safetyCommitmentScore}/10</p>
                    </div>
                  </div>
                  {ev.notes && <p className="text-sm text-[var(--color-ink-700)] whitespace-pre-wrap">{ev.notes}</p>}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}

      <Modal
        open={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        title="Nova avaliação"
        footer={
          <>
            <Button variant="outline" onClick={() => setEvalModalOpen(false)} disabled={createEvaluationMutation.isPending}>Cancelar</Button>
            <Button onClick={() => createEvaluationMutation.mutate()} loading={createEvaluationMutation.isPending}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {(
            [
              ['leadershipScore', 'Liderança'],
              ['communicationScore', 'Comunicação'],
              ['safetyCommitmentScore', 'Comprometimento com segurança'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={`${label} (0 a 10)`} required>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={evalForm[key]}
                  onChange={(e) => setEvalForm({ ...evalForm, [key]: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-8 text-center font-semibold text-[var(--color-ink-900)]">{evalForm[key]}</span>
              </div>
            </Field>
          ))}
          <Field label="Observações">
            <Textarea
              value={evalForm.notes}
              onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
              rows={4}
              placeholder="Pontos observados, contexto da avaliação, combinados com o líder..."
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
