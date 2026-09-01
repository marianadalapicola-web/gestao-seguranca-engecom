import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Eye } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useServerTable } from '../../hooks/useServerTable';
import { useSites, useSectors, useUsersDirectory } from '../../hooks/useReferenceData';
import type { PaginatedResponse } from '../../types';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { MODULE_MARKS } from '../ui/ModuleMark';
import { Button } from '../ui/Button';
import { DataTable } from '../ui/DataTable';
import { Pagination } from '../ui/Pagination';
import { FilterBar, FilterSelect } from '../ui/FilterBar';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EntityForm, validateFields, type FormValues, type FormErrors } from './EntityForm';
import { AttachmentsPanel } from './AttachmentsPanel';
import type { ModuleConfig } from './types';
import { NAV_ITEMS } from '../../routes/navigation';

export function EntityListPage<T extends { id: string }>({ config }: { config: ModuleConfig<T> }) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreate = can(config.key, 'create');
  const canUpdate = can(config.key, 'update');
  const canDelete = can(config.key, 'delete');
  const ModuleIcon = MODULE_MARKS[config.key] ?? NAV_ITEMS.find((item) => item.module === config.key)?.icon;

  const table = useServerTable<T>({
    queryKey: config.apiPath,
    fetcher: async (params) => {
      const { data } = await api.get<PaginatedResponse<T>>(config.apiPath, { params });
      return data;
    },
    initialSortBy: config.defaultSortBy,
    initialSortDir: config.defaultSortDir,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [activeRecord, setActiveRecord] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const { data: sites } = useSites();
  const { data: sectors } = useSectors();
  const { data: users } = useUsersDirectory();

  function recordToValues(record: T | null): FormValues {
    if (!record) return {};
    const raw = record as unknown as Record<string, unknown>;
    const result: FormValues = {};
    for (const field of config.formFields) {
      const value = raw[field.name];
      if (value === null || value === undefined) {
        result[field.name] = '';
      } else if (field.type === 'date' && typeof value === 'string') {
        result[field.name] = value.slice(0, 10);
      } else {
        result[field.name] = String(value);
      }
    }
    return result;
  }

  function openCreate() {
    setMode('create');
    setActiveRecord(null);
    setValues({});
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(record: T) {
    setMode(canUpdate ? 'edit' : 'view');
    setActiveRecord(record);
    setValues(recordToValues(record));
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get('open')) {
      const next = new URLSearchParams(searchParams);
      next.delete('open');
      setSearchParams(next, { replace: true });
    }
  }

  // Deep-link support: notifications and global search send users to
  // `<module>?open=<id>` so the exact record opens instead of a dead link.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    let cancelled = false;
    api
      .get(`${config.apiPath}/${openId}`)
      .then(({ data }) => {
        if (!cancelled) openEdit(data.item as T);
      })
      .catch(() => {
        if (!cancelled) showToast('Registro não encontrado ou sem permissão de acesso.', 'error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('open')]);

  const createMutation = useMutation({
    mutationFn: (payload: FormValues) => api.post(config.apiPath, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] });
      showToast(`${config.singularLabel} registrado com sucesso.`, 'success');
      closeModal();
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível salvar o registro.'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormValues) => api.patch(`${config.apiPath}/${activeRecord!.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] });
      showToast(`${config.singularLabel} atualizado com sucesso.`, 'success');
      closeModal();
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível salvar o registro.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${config.apiPath}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.apiPath] });
      showToast(`${config.singularLabel} excluído com sucesso.`, 'success');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showToast(getApiErrorMessage(err, 'Não foi possível excluir o registro.'), 'error');
      setDeleteTarget(null);
    },
  });

  function handleSubmit() {
    const validationErrors = validateFields(config.formFields, values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (mode === 'create') createMutation.mutate(values);
    else updateMutation.mutate(values);
  }

  const columns = [
    ...config.columns,
    {
      key: '__actions',
      header: '',
      className: 'text-right',
      render: (row: T) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="text-[var(--color-ink-500)] hover:text-[var(--color-brand-700)]"
            title={canUpdate ? 'Editar' : 'Visualizar'}
          >
            {canUpdate ? <Pencil size={15} /> : <Eye size={15} />}
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
              className="text-[var(--color-ink-500)] hover:text-[var(--color-danger-600)]"
              title="Excluir"
            >
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
          title={config.title}
          subtitle={config.subtitle}
          icon={ModuleIcon && <ModuleIcon size={17} />}
          actions={
            canCreate && (
              <Button onClick={openCreate}>
                <Plus size={15} /> Novo {config.singularLabel}
              </Button>
            )
          }
        />
        <CardBody>
          <FilterBar
            search={table.search}
            onSearchChange={table.setSearch}
            searchPlaceholder={config.searchPlaceholder}
            onClear={table.clearFilters}
            hasActiveFilters={table.hasActiveFilters}
          >
            {config.filters?.map((filter) => {
              let options = filter.options ?? [];
              if (filter.type === 'site') options = (sites ?? []).map((s) => ({ value: s.id, label: s.name }));
              if (filter.type === 'sector') options = (sectors ?? []).map((s) => ({ value: s.id, label: s.name }));
              if (filter.type === 'user') options = (users ?? []).map((u) => ({ value: u.id, label: u.name }));
              return (
                <FilterSelect
                  key={filter.key}
                  value={table.filters[filter.key] ?? ''}
                  onChange={(v) => table.updateFilter(filter.key, v)}
                  options={options}
                  placeholder={filter.label}
                />
              );
            })}
          </FilterBar>

          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(row) => row.id}
            sortBy={table.sortBy}
            sortDir={table.sortDir}
            onSortChange={table.toggleSort}
            onRowClick={openEdit}
            loading={table.query.isLoading}
            emptyTitle={config.emptyTitle ?? 'Não há registros para este período.'}
            emptyDescription={config.emptyDescription ?? 'Comece adicionando o primeiro registro.'}
            emptyAction={
              canCreate && (
                <Button size="sm" onClick={openCreate}>
                  <Plus size={14} /> Novo {config.singularLabel}
                </Button>
              )
            }
          />

          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={table.setPage} />
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={mode === 'create' ? `Novo ${config.singularLabel}` : mode === 'edit' ? `Editar ${config.singularLabel}` : config.singularLabel}
        size="lg"
        footer={
          mode === 'view' ? (
            <Button variant="outline" onClick={closeModal}>
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-5">
          <EntityForm
            fields={config.formFields}
            values={values}
            errors={errors}
            onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
            disabled={mode === 'view'}
          />
          {config.attachmentsEnabled && activeRecord && <AttachmentsPanel module={config.key} recordId={activeRecord.id} />}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Excluir ${config.singularLabel.toLowerCase()}?`}
        description={deleteTarget ? `Tem certeza que deseja excluir "${config.getTitle(deleteTarget)}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
