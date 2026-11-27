import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../lib/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { createLeader, deleteLeader, listLeaders, updateLeader, type Leader } from './api';

interface FormState {
  name: string;
  position: string;
  hasSystemAccess: boolean;
  email: string;
  password: string;
}
const emptyForm: FormState = { name: '', position: '', hasSystemAccess: false, email: '', password: '' };

export function LeadersPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = can('leaders', 'create');
  const canUpdate = can('leaders', 'update');
  const canDelete = can('leaders', 'delete');

  const [search, setSearch] = useState('');
  const leadersQuery = useQuery({ queryKey: ['leaders', 'list'], queryFn: () => listLeaders() });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Leader | null>(null);
  const [grantAccessTarget, setGrantAccessTarget] = useState<Leader | null>(null);
  const [accessForm, setAccessForm] = useState({ email: '', password: '' });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(leader: Leader) {
    setEditing(leader);
    setForm({ name: leader.name, position: leader.position ?? '', hasSystemAccess: leader.hasSystemAccess, email: leader.email ?? '', password: '' });
    setErrors({});
    setModalOpen(true);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leaders'] });

  const createMutation = useMutation({
    mutationFn: () =>
      createLeader({
        name: form.name,
        position: form.position || undefined,
        hasSystemAccess: form.hasSystemAccess,
        email: form.hasSystemAccess ? form.email : undefined,
        password: form.hasSystemAccess ? form.password : undefined,
      }),
    onSuccess: () => {
      invalidate();
      showToast('Líder cadastrado com sucesso.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setErrors({ _form: getApiErrorMessage(err, 'Não foi possível cadastrar o líder.') }),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateLeader(editing!.id, { name: form.name, position: form.position || null }),
    onSuccess: () => {
      invalidate();
      showToast('Cadastro do líder atualizado.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setErrors({ _form: getApiErrorMessage(err, 'Não foi possível atualizar o cadastro.') }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (leader: Leader) => updateLeader(leader.id, { status: leader.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' }),
    onSuccess: () => {
      invalidate();
      showToast('Status do líder atualizado.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível alterar o status.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLeader(id),
    onSuccess: () => {
      invalidate();
      showToast('Líder excluído com sucesso.', 'success');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Não foi possível excluir o líder.'), 'error');
      setDeleteTarget(null);
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: () => updateLeader(grantAccessTarget!.id, { hasSystemAccess: true, email: accessForm.email, password: accessForm.password }),
    onSuccess: () => {
      invalidate();
      showToast('Acesso ao sistema liberado para o líder.', 'success');
      setGrantAccessTarget(null);
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível liberar o acesso.'), 'error'),
  });

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome.';
    if (!editing && form.hasSystemAccess) {
      if (!form.email.trim()) nextErrors.email = 'Informe o e-mail de acesso.';
      if (form.password.length < 8) nextErrors.password = 'A senha deve ter ao menos 8 caracteres.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  const items = leadersQuery.data ?? [];
  const filtered = search.trim()
    ? items.filter(
        (l) =>
          l.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (l.position ?? '').toLowerCase().includes(search.trim().toLowerCase())
      )
    : items;

  const columns: Column<Leader>[] = [
    { key: 'name', header: 'Nome', sortable: false },
    { key: 'position', header: 'Cargo', hideOnMobile: true, render: (l) => l.position ?? '—' },
    {
      key: 'sectors',
      header: 'Setor(es)',
      hideOnMobile: true,
      render: (l) => (l.sectorsLed.length > 0 ? l.sectorsLed.map((s) => s.name).join(', ') : '—'),
    },
    {
      key: 'access',
      header: 'Acesso ao sistema',
      render: (l) => (l.hasSystemAccess ? <Badge variant="info">Sim</Badge> : <Badge variant="neutral">Não</Badge>),
    },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
    {
      key: '__actions',
      header: '',
      className: 'text-right',
      render: (l) => (
        <div className="flex items-center justify-end gap-2">
          {!l.hasSystemAccess && canUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGrantAccessTarget(l);
                setAccessForm({ email: '', password: '' });
              }}
              className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
              title="Liberar acesso ao sistema"
            >
              <KeyRound size={15} />
            </button>
          )}
          {canUpdate && (
            <button onClick={(e) => { e.stopPropagation(); openEdit(l); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]" title="Editar cadastro">
              <Pencil size={15} />
            </button>
          )}
          {canUpdate && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(l); }}
              className={l.status === 'ACTIVE' ? 'text-[var(--color-warning-600)] hover:text-[var(--color-warning-700)]' : 'text-[var(--color-success-600)] hover:text-[var(--color-success-700)]'}
              title={l.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
            >
              {l.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
            </button>
          )}
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(l); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]" title="Excluir">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Líderes"
        subtitle="Cadastro das lideranças da ENGECOM para acompanhamento e avaliação — mesmo quem não usa o sistema pode ser cadastrado e avaliado aqui."
        actions={canManage ? <Button onClick={openCreate}><Plus size={15} /> Novo Líder</Button> : undefined}
      />

      <Card>
        <CardBody>
          <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Pesquisar por nome ou cargo..." onClear={() => setSearch('')} hasActiveFilters={search.length > 0} />

          <DataTable
            columns={columns}
            rows={filtered}
            getRowId={(l) => l.id}
            onRowClick={(l) => navigate(`/ranking-lideranca/${l.id}`)}
            loading={leadersQuery.isLoading}
            emptyTitle="Nenhum líder cadastrado."
            emptyDescription="Cadastre o primeiro líder para começar a acompanhar seu desempenho."
          />
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Cadastro do Líder' : 'Novo Líder'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>Salvar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {errors._form && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{errors._form}</div>}
          <Field label="Nome completo" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Cargo">
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ex.: Encarregado de Obra" />
          </Field>

          {!editing && (
            <>
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink-700)]">
                <input
                  type="checkbox"
                  checked={form.hasSystemAccess}
                  onChange={(e) => setForm({ ...form, hasSystemAccess: e.target.checked })}
                />
                Este líder terá acesso ao sistema (login)
              </label>
              {!form.hasSystemAccess && (
                <p className="text-xs text-[var(--color-ink-500)] -mt-2">
                  O líder ficará cadastrado para ser avaliado e aparecer no Ranking de Liderança, mas não poderá entrar no sistema. Dá pra liberar o acesso depois.
                </p>
              )}
              {form.hasSystemAccess && (
                <>
                  <Field label="E-mail de acesso" required error={errors.email}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Senha provisória" required error={errors.password} hint="Mínimo de 8 caracteres, com letras e números.">
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </Field>
                </>
              )}
            </>
          )}

          {editing && (
            <p className="text-xs text-[var(--color-ink-500)]">
              Acesso ao sistema: <b>{editing.hasSystemAccess ? 'Sim' : 'Não'}</b>
              {!editing.hasSystemAccess && ' — use o ícone de chave na lista para liberar o acesso.'}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={!!grantAccessTarget}
        onClose={() => setGrantAccessTarget(null)}
        title={`Liberar acesso para ${grantAccessTarget?.name ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setGrantAccessTarget(null)} disabled={grantAccessMutation.isPending}>Cancelar</Button>
            <Button onClick={() => grantAccessMutation.mutate()} loading={grantAccessMutation.isPending}>Liberar acesso</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="E-mail de acesso" required>
            <Input type="email" value={accessForm.email} onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })} />
          </Field>
          <Field label="Senha provisória" required hint="Mínimo de 8 caracteres, com letras e números.">
            <Input type="password" value={accessForm.password} onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir líder?"
        description={deleteTarget ? `Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
