import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getApiErrorMessage } from '../../lib/api';
import { useSites, useSectors, useUsersDirectory } from '../../hooks/useReferenceData';
import { fetchIdsConfig, updateIdsConfig } from '../ids/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ROLE_LABELS } from '../../types';

function SitesManager() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: sites, isLoading } = useSites();
  const [name, setName] = useState('');
  const canManage = can('sites', 'create');

  const createMutation = useMutation({
    mutationFn: () => api.post('/sites', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'sites'] });
      setName('');
      showToast('Obra/unidade cadastrada.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'sites'] });
      showToast('Obra/unidade desativada.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  return (
    <Card>
      <CardHeader title="Obras / Unidades" subtitle="Locais utilizados para classificar registros de segurança." />
      <CardBody className="flex flex-col gap-3">
        {canManage && (
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da obra/unidade" />
            <Button onClick={() => name.trim() && createMutation.mutate()} loading={createMutation.isPending}>
              <Plus size={14} /> Adicionar
            </Button>
          </div>
        )}
        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {(sites ?? []).map((site) => (
              <li key={site.id} className="flex items-center justify-between py-2 text-sm">
                {site.name}
                {canManage && (
                  <button onClick={() => deleteMutation.mutate(site.id)} className="text-[var(--color-danger-600)] hover:text-[var(--color-danger-700)]">
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
            {(sites ?? []).length === 0 && <p className="text-sm text-[var(--color-ink-500)] py-2">Nenhuma obra cadastrada.</p>}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function SectorsManager() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: sites } = useSites();
  const { data: sectors, isLoading } = useSectors();
  const { data: users } = useUsersDirectory();
  const leaders = (users ?? []).filter((u) => u.role === 'LEADERSHIP');
  const [name, setName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const canManage = can('sectors', 'create');
  const canEdit = can('sectors', 'update');

  const createMutation = useMutation({
    mutationFn: () => api.post('/sectors', { name, siteId: siteId || undefined, leaderId: leaderId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'sectors'] });
      setName('');
      setLeaderId('');
      showToast('Setor cadastrado.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sectors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'sectors'] });
      showToast('Setor desativado.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  const leaderMutation = useMutation({
    mutationFn: ({ id, leaderId }: { id: string; leaderId: string }) => api.patch(`/sectors/${id}`, { leaderId: leaderId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', 'sectors'] });
      showToast('Líder do setor atualizado.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  return (
    <Card>
      <CardHeader
        title="Setores"
        subtitle="Setores vinculados às obras/unidades. O líder define a quem os indicadores da área são atribuídos no Ranking de Liderança."
      />
      <CardBody className="flex flex-col gap-3">
        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do setor" className="flex-1" />
            <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="sm:w-48">
              <option value="">Sem obra vinculada</option>
              {sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className="sm:w-48">
              <option value="">Sem líder definido</option>
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
            <Button onClick={() => name.trim() && createMutation.mutate()} loading={createMutation.isPending}>
              <Plus size={14} /> Adicionar
            </Button>
          </div>
        )}
        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {(sectors ?? []).map((sector) => (
              <li key={sector.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 text-sm">
                <span>{sector.name}</span>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <Select
                      value={sector.leader?.id ?? ''}
                      onChange={(e) => leaderMutation.mutate({ id: sector.id, leaderId: e.target.value })}
                      className="!py-1 text-xs sm:w-44"
                    >
                      <option value="">Sem líder definido</option>
                      {leaders.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </Select>
                  ) : (
                    <span className="text-xs text-[var(--color-ink-500)]">{sector.leader?.name ?? 'Sem líder definido'}</span>
                  )}
                  {canManage && (
                    <button onClick={() => deleteMutation.mutate(sector.id)} className="text-[var(--color-danger-600)] hover:text-[var(--color-danger-700)]">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {(sectors ?? []).length === 0 && <p className="text-sm text-[var(--color-ink-500)] py-2">Nenhum setor cadastrado.</p>}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function IdsFormulaManager() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({ queryKey: ['ids', 'config'], queryFn: fetchIdsConfig });
  const [description, setDescription] = useState('');
  const canEdit = can('config', 'update');

  const mutation = useMutation({
    mutationFn: () => updateIdsConfig({ formulaDescription: description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ids', 'config'] });
      showToast('Configuração do IDS atualizada.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <CardHeader title="Configuração do IDS" subtitle="Descrição da fórmula oficial (pesos e critérios). Exclusivo do Administrador." />
      <CardBody className="flex flex-col gap-3">
        <Textarea
          defaultValue={config?.formulaDescription ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          rows={4}
        />
        {canEdit && (
          <div>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>Salvar</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function BroadcastNotice() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => api.post('/notifications/broadcast', { title, message, roles: roles.length ? roles : undefined }),
    onSuccess: () => {
      showToast('Aviso enviado com sucesso.', 'success');
      setTitle('');
      setMessage('');
      setRoles([]);
    },
    onError: (err) => showToast(getApiErrorMessage(err), 'error'),
  });

  function toggleRole(role: string) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  return (
    <Card>
      <CardHeader title="Enviar Aviso Administrativo" subtitle="Notifica os perfis selecionados (ou todos, se nenhum for marcado)." />
      <CardBody className="flex flex-col gap-3">
        <Field label="Título">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Mensagem">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleRole(value)}
              className={`text-xs px-3 py-1.5 rounded-full border ${roles.includes(value) ? 'bg-[var(--color-brand-700)] text-white border-[var(--color-brand-700)]' : 'border-[var(--color-border-strong)] text-[var(--color-ink-700)]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <Button onClick={() => title && message && mutation.mutate()} loading={mutation.isPending} disabled={!title || !message}>
            Enviar Aviso
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function SettingsPage() {
  const { can } = useAuth();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Configurações" subtitle="Dados de referência e parâmetros do sistema." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SitesManager />
        <SectorsManager />
        <IdsFormulaManager />
        {can('notifications', 'create') && <BroadcastNotice />}
      </div>
    </div>
  );
}
