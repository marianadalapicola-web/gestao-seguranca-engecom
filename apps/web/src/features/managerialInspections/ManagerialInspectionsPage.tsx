import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useServerTable } from '../../hooks/useServerTable';
import { useSectors } from '../../hooks/useReferenceData';
import { getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { ClipboardList } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { FilterBar, FilterSelect } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field } from '../../components/ui/Field';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AttachmentsPanel } from '../../components/entity/AttachmentsPanel';
import { ChecklistEditor } from './ChecklistEditor';
import {
  createManagerialInspection,
  deleteManagerialInspection,
  listManagerialInspections,
  updateManagerialInspection,
  type ChecklistItem,
  type ManagerialInspection,
} from './api';

function classificationVariant(classification: string | null): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  if (classification === 'Excelente') return 'success';
  if (classification === 'Bom') return 'info';
  if (classification === 'Regular') return 'warning';
  if (classification === 'Crítico') return 'danger';
  return 'neutral';
}

function previewScore(checklist: ChecklistItem[]) {
  let total = 0;
  let max = 0;
  for (const item of checklist) {
    if (item.conforme === null || item.conforme === undefined) continue;
    max += Number(item.weight) || 0;
    if (item.conforme) total += Number(item.weight) || 0;
  }
  const percentage = max > 0 ? (total / max) * 100 : 0;
  return { total, max, percentage: Math.round(percentage * 100) / 100 };
}

const emptyForm = { date: '', team: '', sectorId: '', nonConformities: '', notes: '' };

export function ManagerialInspectionsPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canCreate = can('managerialInspections', 'create');
  const canUpdate = can('managerialInspections', 'update');
  const canDelete = can('managerialInspections', 'delete');

  const table = useServerTable<ManagerialInspection>({
    queryKey: '/managerial-inspections',
    fetcher: (params) => listManagerialInspections(params),
    initialSortBy: 'date',
    initialSortDir: 'desc',
  });

  const { data: sectors } = useSectors();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagerialInspection | null>(null);

  function openCreate() {
    setMode('create');
    setActiveId(null);
    setForm(emptyForm);
    setChecklist([{ item: '', weight: 1, conforme: null, observacao: '' }]);
    setError(null);
    setModalOpen(true);
  }

  function openView(record: ManagerialInspection) {
    setMode(canUpdate ? 'edit' : 'view');
    setActiveId(record.id);
    setForm({
      date: record.date.slice(0, 10),
      team: record.team ?? '',
      sectorId: record.sectorId ?? '',
      nonConformities: record.nonConformities ?? '',
      notes: record.notes ?? '',
    });
    setChecklist(record.checklist ?? []);
    setError(null);
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, checklist };
      if (mode === 'create') return createManagerialInspection(payload);
      return updateManagerialInspection(activeId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/managerial-inspections'] });
      showToast('Inspeção gerencial registrada com sucesso.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setError(getApiErrorMessage(err, 'Não foi possível salvar a inspeção.')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManagerialInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/managerial-inspections'] });
      showToast('Inspeção excluída com sucesso.', 'success');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Não foi possível excluir.'), 'error');
      setDeleteTarget(null);
    },
  });

  function handleSubmit() {
    if (!form.date) return setError('Informe a data da inspeção.');
    const validItems = checklist.filter((c) => c.item.trim());
    if (validItems.length === 0) return setError('Adicione ao menos um item ao checklist.');
    setError(null);
    saveMutation.mutate();
  }

  const preview = previewScore(checklist);

  const columns: Column<ManagerialInspection>[] = [
    { key: 'date', header: 'Data', sortable: true, render: (r) => formatDate(r.date) },
    { key: 'team', header: 'Equipe', hideOnMobile: true, render: (r) => r.team ?? '—' },
    { key: 'sector', header: 'Setor', hideOnMobile: true, render: (r) => r.sector?.name ?? '—' },
    { key: 'percentage', header: 'Resultado', render: (r) => `${r.percentage.toFixed(0)}%` },
    { key: 'classification', header: 'Classificação', render: (r) => <Badge variant={classificationVariant(r.classification)}>{r.classification ?? '—'}</Badge> },
    {
      key: '__actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); openView(r); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]">
            {canUpdate ? <Pencil size={15} /> : <Eye size={15} />}
          </button>
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const data = table.query.data;

  return (
    <div>
      <Card>
        <CardHeader
          title="Inspeção Gerencial / Cruzada"
          subtitle="Checklists com pontuação ponderada e classificação automática."
          icon={<ClipboardList size={17} />}
          actions={
            canCreate && (
              <Button onClick={openCreate}>
                <Plus size={15} /> Nova Inspeção
              </Button>
            )
          }
        />
        <CardBody>
          <FilterBar search={table.search} onSearchChange={table.setSearch} searchPlaceholder="Pesquisar por equipe ou classificação..." onClear={table.clearFilters} hasActiveFilters={table.hasActiveFilters}>
            <FilterSelect
              value={table.filters.sectorId ?? ''}
              onChange={(v) => table.updateFilter('sectorId', v)}
              options={(sectors ?? []).map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Setor"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(r) => r.id}
            sortBy={table.sortBy}
            sortDir={table.sortDir}
            onSortChange={table.toggleSort}
            onRowClick={openView}
            loading={table.query.isLoading}
            emptyDescription="Comece registrando a primeira inspeção gerencial/cruzada."
            emptyAction={canCreate && <Button size="sm" onClick={openCreate}><Plus size={14} /> Nova Inspeção</Button>}
          />

          {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={table.setPage} />}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={mode === 'create' ? 'Nova Inspeção Gerencial/Cruzada' : 'Inspeção Gerencial/Cruzada'}
        size="xl"
        footer={
          mode === 'view' ? (
            <Button variant="outline" onClick={() => setModalOpen(false)}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveMutation.isPending}>Cancelar</Button>
              <Button onClick={handleSubmit} loading={saveMutation.isPending}>Salvar</Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-5">
          {error && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Data" required>
              <Input type="date" value={form.date} disabled={mode === 'view'} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Equipe">
              <Input value={form.team} disabled={mode === 'view'} placeholder="Membros da equipe" onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </Field>
            <Field label="Setor">
              <Select value={form.sectorId} disabled={mode === 'view'} onChange={(e) => setForm({ ...form, sectorId: e.target.value })}>
                <option value="">Selecione...</option>
                {sectors?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-ink-700)] mb-2">Checklist de verificação</p>
            <ChecklistEditor items={checklist} onChange={setChecklist} disabled={mode === 'view'} />
          </div>

          <div className="flex items-center gap-6 bg-[var(--color-brand-50)] rounded-md px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">Pontuação</p>
              <p className="text-lg font-semibold text-[var(--color-ink-900)]">{preview.total} / {preview.max}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-500)]">Percentual</p>
              <p className="text-lg font-semibold text-[var(--color-ink-900)]">{preview.percentage.toFixed(0)}%</p>
            </div>
          </div>

          <Field label="Não conformidades">
            <Textarea value={form.nonConformities} disabled={mode === 'view'} onChange={(e) => setForm({ ...form, nonConformities: e.target.value })} />
          </Field>
          <Field label="Observações">
            <Textarea value={form.notes} disabled={mode === 'view'} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          {activeId && <AttachmentsPanel module="managerialInspections" recordId={activeId} />}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir inspeção?"
        description="Tem certeza que deseja excluir esta inspeção gerencial? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
