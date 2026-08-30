import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({ email: z.string().email('Informe um e-mail válido.') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const { data } = await api.post('/auth/forgot-password', values);
      setDevLink(data.devResetLink ?? null);
      setSent(true);
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

        <h2 className="text-xl font-semibold text-[var(--color-ink-900)] mb-1">Redefinir senha</h2>
        <p className="text-sm text-[var(--color-ink-500)] mb-6">
          Informe seu e-mail corporativo. Se ele existir em nossa base, enviaremos um link de redefinição.
        </p>

        {sent ? (
          <div className="rounded-md bg-[var(--color-success-50)] text-[var(--color-success-700)] text-sm px-4 py-3">
            <p>Se o e-mail existir em nossa base, um link de redefinição foi gerado.</p>
            {devLink && (
              <p className="mt-2 text-xs break-all">
                Ambiente de desenvolvimento (sem provedor de e-mail configurado):{' '}
                <Link to={devLink.replace(window.location.origin, '')} className="underline font-medium">
                  {devLink}
                </Link>
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {error && <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">{error}</div>}
            <Field label="E-mail" required error={errors.email?.message}>
              <Input type="email" placeholder="seu.email@engecom.com.br" hasError={!!errors.email} {...register('email')} />
            </Field>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Enviar link de redefinição
            </Button>
          </form>
        )}

        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-700)] hover:underline mt-6">
          <ArrowLeft size={14} /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
