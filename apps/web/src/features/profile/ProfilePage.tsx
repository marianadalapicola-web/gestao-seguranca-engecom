import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api, getApiErrorMessage, resolveAssetUrl } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 4 * 1024 * 1024;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateNameMutation = useMutation({
    mutationFn: () => api.patch('/auth/profile', { name }),
    onSuccess: async () => {
      await refreshUser();
      showToast('Perfil atualizado com sucesso.', 'success');
    },
    onError: (err) => setNameError(getApiErrorMessage(err)),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/auth/avatar', formData);
    },
    onSuccess: async () => {
      await refreshUser();
      showToast('Foto de perfil atualizada.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível enviar a foto.'), 'error'),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => api.delete('/auth/avatar'),
    onSuccess: async () => {
      await refreshUser();
      showToast('Foto de perfil removida.', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Não foi possível remover a foto.'), 'error'),
  });

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showToast('Envie uma imagem JPG, PNG ou WEBP.', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showToast('A imagem deve ter no máximo 4MB.', 'error');
      return;
    }
    uploadAvatarMutation.mutate(file);
  }

  const changePasswordMutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
    onSuccess: () => {
      showToast('Senha alterada com sucesso.', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => setPasswordError(getApiErrorMessage(err)),
  });

  function handleSaveName() {
    if (!name.trim()) {
      setNameError('Informe o nome.');
      return;
    }
    setNameError(null);
    updateNameMutation.mutate();
  }

  function handleChangePassword() {
    if (passwords.newPassword.length < 8) {
      setPasswordError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }
    setPasswordError(null);
    changePasswordMutation.mutate();
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader title="Meu Perfil" subtitle="Suas informações de acesso ao sistema." />

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="relative shrink-0 group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-[var(--color-brand-700)] text-white text-xl font-semibold flex items-center justify-center overflow-hidden relative"
              title="Alterar foto"
            >
              {user.avatarUrl ? (
                <img src={resolveAssetUrl(user.avatarUrl)!} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={18} />
              </span>
            </button>
            {uploadAvatarMutation.isPending && (
              <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-[10px]">...</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[var(--color-ink-900)]">{user.name}</p>
            <p className="text-sm text-[var(--color-ink-500)]">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="brand">{user.roleLabel}</Badge>
              {user.position && <span className="text-xs text-[var(--color-ink-500)]">{user.position}</span>}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-[var(--color-brand-700)] hover:underline"
              >
                Alterar foto
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={() => removeAvatarMutation.mutate()}
                  disabled={removeAvatarMutation.isPending}
                  className="text-xs font-medium text-[var(--color-danger-600)] hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remover foto
                </button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Informações da conta" />
        <CardBody className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[var(--color-ink-500)]">Data de criação</p>
            <p className="text-[var(--color-ink-900)]">{formatDateTime(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-500)]">Último acesso</p>
            <p className="text-[var(--color-ink-900)]">{formatDateTime(user.lastLoginAt)}</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Editar nome" subtitle="Você não pode alterar seu próprio perfil de acesso ou e-mail por aqui." />
        <CardBody className="flex flex-col gap-4">
          {nameError && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{nameError}</div>}
          <Field label="Nome completo">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div>
            <Button onClick={handleSaveName} loading={updateNameMutation.isPending}>Salvar</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Alterar senha" />
        <CardBody className="flex flex-col gap-4">
          {passwordError && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{passwordError}</div>}
          <Field label="Senha atual" required>
            <Input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          </Field>
          <Field label="Nova senha" required hint="Mínimo de 8 caracteres, com letras e números.">
            <Input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          </Field>
          <Field label="Confirmar nova senha" required>
            <Input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
          </Field>
          <div>
            <Button onClick={handleChangePassword} loading={changePasswordMutation.isPending}>Alterar senha</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
