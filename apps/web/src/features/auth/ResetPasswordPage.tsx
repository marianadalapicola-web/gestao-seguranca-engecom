import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter ao menos 8 caracteres.')
      .regex(/[a-zA-Z]/, 'A senha deve conter letras.')
      .regex(/[0-9]/, 'A senha deve conter números.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-md bg-[var(--color-brand-800)] flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink-900)] leading-tight">ENGECOM</p>
            <p className="text-xs text-[var(--color-ink-500)] leading-tight">Gestão de Segurança</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-[var(--color-ink-900)] mb-1">Definir nova senha</h2>
        <p className="text-sm text-[var(--color-ink-500)] mb-6">Escolha uma nova senha para sua conta.</p>

        {!token ? (
          <div className="rounded-md bg-[var(--color-warning-50)] text-[var(--color-warning-700)] text-sm px-3 py-2.5">
            Link inválido. Solicite uma nova redefinição de senha.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {error && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{error}</div>}
            <Field label="Nova senha" required error={errors.password?.message} hint="Mínimo de 8 caracteres, com letras e números.">
              <Input type="password" hasError={!!errors.password} {...register('password')} />
            </Field>
            <Field label="Confirmar nova senha" required error={errors.confirmPassword?.message}>
              <Input type="password" hasError={!!errors.confirmPassword} {...register('confirmPassword')} />
            </Field>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Redefinir senha
            </Button>
          </form>
        )}

        <Link to="/login" className="inline-block text-sm text-[var(--color-brand-700)] hover:underline mt-6">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
