import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useServerTable } from '../../hooks/useServerTable';
import { getApiErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { ROLE_LABELS, type Role } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { FilterBar, FilterSelect } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field } from '../../components/ui/Field';
import { Input, Select } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { createUser, deleteUser, listUsers, updateUser, type ManagedUser } from './api';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'BLOCKED', label: 'Bloqueado' },
];

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  position: string;
}
const emptyForm: FormState = { name: '', email: '', password: '', role: 'SAFETY_TECHNICIAN', position: '' };

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const table = useServerTable<ManagedUser>({
    queryKey: '/users',
    fetcher: (params) => listUsers(params),
    initialSortBy: 'createdAt',
    initialSortDir: 'desc',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(u: ManagedUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, position: u.position ?? '' });
    setErrors({});
    setModalOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: () => createUser({ name: form.name, email: form.email, password: form.password, role: form.role, position: form.position || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      showToast('Usuário criado com sucesso.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setErrors({ _form: getApiErrorMessage(err, 'Não foi possível criar o usuário.') }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUser(editing!.id, { name: form.name, email: form.email, role: form.role, position: form.position || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      showToast('Usuário atualizado com sucesso.', 'success');
      setModalOpen(false);
    },
    onError: (err) => setErrors({ _form: getApiErrorMessage(err, 'Não foi possível atualizar o usuário.') }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (u: ManagedUser) => updateUser(u.id, { status: u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      showToast('Status do usuário atualizado.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível alterar o status.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/users'] });
      showToast('Usuário excluído com sucesso.', 'success');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Não foi possível excluir o usuário.'), 'error');
      setDeleteTarget(null);
    },
  });

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome.';
    if (!form.email.trim()) nextErrors.email = 'Informe o e-mail.';
    if (!editing && form.password.length < 8) nextErrors.password = 'A senha deve ter ao menos 8 caracteres.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  const columns: Column<ManagedUser>[] = [
    { key: 'name', header: 'Nome', sortable: true },
    { key: 'email', header: 'E-mail', hideOnMobile: true },
    { key: 'roleLabel', header: 'Perfil' },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'lastLoginAt', header: 'Último acesso', hideOnMobile: true, render: (u) => formatDateTime(u.lastLoginAt) },
    {
      key: '__actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]" title="Editar">
            <Pencil size={15} />
          </button>
          {u.id !== currentUser?.id && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(u); }}
                className={u.status === 'ACTIVE' ? 'text-[var(--color-warning-600)] hover:text-[var(--color-warning-700)]' : 'text-[var(--color-success-600)] hover:text-[var(--color-success-700)]'}
                title={u.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
              >
                {u.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }} className="text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]" title="Excluir">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const data = table.query.data;

  return (
    <div>
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Área exclusiva do Administrador — cadastro, permissões e status de acesso."
        actions={<Button onClick={openCreate}><Plus size={15} /> Novo Usuário</Button>}
      />

      <Card>
        <CardBody>
          <FilterBar search={table.search} onSearchChange={table.setSearch} searchPlaceholder="Pesquisar por nome ou e-mail..." onClear={table.clearFilters} hasActiveFilters={table.hasActiveFilters}>
            <FilterSelect value={table.filters.role ?? ''} onChange={(v) => table.updateFilter('role', v)} options={ROLE_OPTIONS} placeholder="Perfil" />
            <FilterSelect value={table.filters.status ?? ''} onChange={(v) => table.updateFilter('status', v)} options={STATUS_OPTIONS} placeholder="Status" />
          </FilterBar>

          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(u) => u.id}
            sortBy={table.sortBy}
            sortDir={table.sortDir}
            onSortChange={table.toggleSort}
            onRowClick={openEdit}
            loading={table.query.isLoading}
            emptyTitle="Nenhum usuário encontrado."
            emptyDescription="Cadastre o primeiro usuário do sistema."
          />

          {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={table.setPage} />}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
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
          <Field label="E-mail" required error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          {!editing && (
            <Field label="Senha provisória" required error={errors.password} hint="Mínimo de 8 caracteres, com letras e números.">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          )}
          <Field label="Perfil de acesso" required>
            <Select
              value={form.role}
              disabled={editing?.id === currentUser?.id}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            {editing?.id === currentUser?.id && (
              <p className="text-xs text-[var(--color-ink-500)] mt-1">Você não pode alterar seu próprio nível de acesso.</p>
            )}
          </Field>
          <Field label="Cargo">
            <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir usuário?"
        description={deleteTarget ? `Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
