import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthLogo } from './AuthLogo';

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 brand-gradient text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <img src="/logo-engecom.png" alt="ENGECOM" className="relative h-10 w-auto" />
        <div className="relative max-w-md">
          <div className="h-1 w-14 safety-stripe rounded-full mb-5" />
          <h1 className="text-3xl font-semibold leading-tight mb-4">
            Segurança do trabalho, centralizada e sob controle.
          </h1>
          <p className="text-[var(--color-brand-200)] text-sm leading-relaxed">
            Acompanhe rituais, DDS, inspeções, desvios e o Índice de Desenvolvimento de Segurança (IDS) da ENGECOM em
            uma única plataforma corporativa.
          </p>
        </div>
        <p className="relative text-xs text-[var(--color-brand-300)]">© {new Date().getFullYear()} ENGECOM</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--color-surface)]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <AuthLogo />
          </div>

          <h2 className="text-xl font-semibold text-[var(--color-ink-900)] mb-1">Entrar</h2>
          <p className="text-sm text-[var(--color-ink-500)] mb-6">Acesse com suas credenciais corporativas.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {serverError && (
              <div className="rounded-md bg-[var(--color-danger-50)] text-[var(--color-danger-700)] text-sm px-3 py-2.5">
                {serverError}
              </div>
            )}

            <Field label="E-mail" required error={errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="seu.email@engecom.com.br" hasError={!!errors.email} {...register('email')} />
            </Field>

            <Field label="Senha" required error={errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  hasError={!!errors.password}
                  className="pr-9"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end -mt-1">
              <Link to="/esqueci-senha" className="text-xs text-[var(--color-brand-700)] hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              <LogIn size={16} /> Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
