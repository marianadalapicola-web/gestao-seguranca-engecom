import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Pencil, Plus, Target, TrendingUp, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../lib/api';
import { formatPeriod } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field } from '../../components/ui/Field';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GaugeChart } from '../../components/charts/GaugeChart';
import { EvolutionChart } from '../../components/charts/EvolutionChart';
import { fetchIdsConfig, fetchIdsSummary, deleteIdsRecord, upsertIdsRecord, type IdsRecord } from './api';

function classificationVariant(classification: string | null) {
  if (classification === 'Meta Atingida') return 'success' as const;
  if (classification === 'Próximo da Meta') return 'info' as const;
  if (classification === 'Atenção') return 'warning' as const;
  if (classification === 'Crítico') return 'danger' as const;
  return 'neutral' as const;
}

const emptyForm = { period: '', value: '', target: '', notes: '' };

export function IdsPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = can('ids', 'update');

  const summaryQuery = useQuery({ queryKey: ['ids', 'summary'], queryFn: fetchIdsSummary });
  const configQuery = useQuery({ queryKey: ['ids', 'config'], queryFn: fetchIdsConfig });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IdsRecord | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertIdsRecord({
        period: form.period,
        value: form.value ? Number(form.value) : undefined,
        target: form.target ? Number(form.target) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ids'] });
      showToast('Resultado do IDS registrado com sucesso.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Não foi possível salvar o resultado.')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIdsRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ids'] });
      showToast('Registro removido.', 'success');
      setDeleteTarget(null);
    },
  });

  function openNewRecord() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period)) {
      setError('Informe o período no formato AAAA-MM (ex.: 2026-01).');
      return;
    }
    setError(null);
    saveMutation.mutate();
  }

  const summary = summaryQuery.data;
  const current = summary?.current;
  const previous = summary?.previous;

  const trend =
    current?.value !== null && current?.value !== undefined && previous?.value !== null && previous?.value !== undefined
      ? Math.round((current.value - previous.value) * 100) / 100
      : null;

  const columns: Column<IdsRecord>[] = [
    { key: 'period', header: 'Período', render: (r) => formatPeriod(r.period) },
    { key: 'value', header: 'Resultado', render: (r) => r.value ?? '—' },
    { key: 'target', header: 'Meta', render: (r) => r.target ?? '—' },
    {
      key: 'percentAchieved',
      header: '% da Meta',
      render: (r) => (r.value !== null && r.target ? `${Math.round((r.value / r.target) * 100)}%` : '—'),
    },
    { key: 'classification', header: 'Classificação', render: (r) => <Badge variant={classificationVariant(r.classification)}>{r.classification ?? '—'}</Badge> },
    ...(canManage
      ? [
          {
            key: '__actions',
            header: '',
            className: 'text-right',
            render: (r: IdsRecord) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setForm({ period: r.period, value: r.value?.toString() ?? '', target: r.target?.toString() ?? '', notes: r.notes ?? '' });
                    setError(null);
                    setModalOpen(true);
                  }}
                  className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
                >
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteTarget(r)} className="text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]">
                  <Trash2 size={15} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Índice de Desenvolvimento de Segurança (IDS)"
        subtitle="Indicador principal de desempenho em segurança do trabalho da ENGECOM."
        actions={canManage && <Button onClick={openNewRecord}><Plus size={15} /> Registrar Resultado</Button>}
      />

      {configQuery.data && Object.keys(configQuery.data.weights ?? {}).length === 0 && (
        <div className="flex items-start gap-3 rounded-md bg-[var(--color-warning-50)] text-[var(--color-warning-700)] px-4 py-3 text-sm">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Fórmula do IDS ainda não configurada</p>
            <p className="text-xs mt-0.5">
              {configQuery.data.formulaDescription} Os resultados abaixo são lançados manualmente até que os pesos e critérios oficiais
              da ENGECOM sejam definidos.
            </p>
          </div>
        </div>
      )}

      {summaryQuery.isLoading ? (
        <Spinner label="Carregando IDS..." />
      ) : !current ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Nenhum resultado de IDS registrado ainda."
              description="Registre o primeiro resultado mensal para começar a acompanhar a evolução."
              action={canManage && <Button onClick={openNewRecord}><Plus size={14} /> Registrar Resultado</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-1 flex flex-col items-center justify-center py-6">
            <p className="text-xs font-medium text-[var(--color-ink-500)] uppercase tracking-wide mb-2">{formatPeriod(current.period)}</p>
            <GaugeChart percent={current.percentAchieved} size={220} />
            <p className="text-3xl font-bold text-[var(--color-ink-900)] mt-2">{current.value ?? '—'}</p>
            <Badge variant={classificationVariant(current.classification)}>{current.classification ?? 'Sem classificação'}</Badge>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Resumo" />
            <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)] flex items-center gap-1"><Target size={11} /> Meta</p>
                <p className="text-xl font-semibold text-[var(--color-ink-900)]">{current.target ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">Resultado Anterior</p>
                <p className="text-xl font-semibold text-[var(--color-ink-900)]">{previous?.value ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)] flex items-center gap-1"><TrendingUp size={11} /> Evolução</p>
                <p className={`text-xl font-semibold ${trend !== null && trend >= 0 ? 'text-[var(--color-success-700)]' : 'text-[var(--color-danger-700)]'}`}>
                  {trend !== null ? (trend >= 0 ? `+${trend}` : trend) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">% Atingido</p>
                <p className="text-xl font-semibold text-[var(--color-ink-900)]">
                  {current.percentAchieved !== null ? `${current.percentAchieved}%` : '—'}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Evolução do IDS" subtitle="Histórico de resultados mensais" />
        <CardBody>
          {summaryQuery.isLoading ? (
            <Spinner />
          ) : (summary?.history.length ?? 0) === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)] text-center py-10">Sem histórico suficiente para exibir a evolução.</p>
          ) : (
            <EvolutionChart
              data={(summary?.history ?? []).map((h) => ({ period: formatPeriod(h.period), value: h.value, target: h.target }))}
              series={[
                { key: 'value', label: 'Resultado', color: '#1f5fa3' },
                { key: 'target', label: 'Meta', color: '#98a2b3' },
              ]}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Histórico de Resultados" />
        <CardBody>
          <DataTable columns={columns} rows={summary?.history ?? []} getRowId={(r) => r.id} emptyDescription="Nenhum registro no histórico." />
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Resultado do IDS"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveMutation.isPending}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{error}</div>}
          <Field label="Período (AAAA-MM)" required>
            <Input placeholder="2026-01" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Resultado">
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Field>
            <Field label="Meta">
              <Input type="number" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir registro do IDS?"
        description="Esta ação removerá o resultado deste período do histórico."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
