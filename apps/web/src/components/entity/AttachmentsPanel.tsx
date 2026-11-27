import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import type { Attachment, ModuleKey } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({ module, recordId }: { module: ModuleKey; recordId: string }) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = can(module, 'update');

  const { data, isLoading } = useQuery({
    queryKey: ['attachments', module, recordId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Attachment[] }>(`/attachments/record/${module}/${recordId}`);
      return data.items;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('module', module);
      formData.append('recordId', recordId);
      formData.append('file', file);
      await api.post('/attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', module, recordId] });
      showToast('Evidência anexada com sucesso.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível anexar o arquivo.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', module, recordId] });
      showToast('Evidência removida.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível remover o arquivo.'), 'error'),
  });

  function handleDownload(attachment: Attachment) {
    window.open(`/api/attachments/${attachment.id}/download`, '_blank');
  }

  return (
    <div className="border border-[var(--color-border)] rounded-md">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <p className="text-xs font-semibold text-[var(--color-ink-700)] inline-flex items-center gap-1.5">
          <Paperclip size={13} /> Evidências / Anexos
        </p>
        {canManage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploadMutation.isPending}>
              <Upload size={13} /> Adicionar
            </Button>
          </>
        )}
      </div>
      <div className="p-3">
        {isLoading ? (
          <Spinner />
        ) : !data || data.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-500)] py-2">Nenhuma evidência anexada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {data.map((att) => (
              <li key={att.id} className="flex items-center gap-2 text-sm bg-[var(--color-surface)] rounded-md px-2.5 py-2">
                <Paperclip size={13} className="text-[var(--color-ink-400)] shrink-0" />
                <span className="flex-1 min-w-0 truncate">{att.fileName}</span>
                <span className="text-xs text-[var(--color-ink-400)] shrink-0">{formatSize(att.size)}</span>
                <button onClick={() => handleDownload(att)} className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-800)] shrink-0" title="Baixar">
                  <Download size={14} />
                </button>
                {canManage && (
                  <button
                    onClick={() => deleteMutation.mutate(att.id)}
                    className="text-[var(--color-danger-600)] hover:text-[var(--color-danger-700)] shrink-0"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
