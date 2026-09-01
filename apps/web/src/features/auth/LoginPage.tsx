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
import { Tag } from '../../components/ui/Tag';
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
        <div className="absolute inset-0 technical-grid" />
        <div className="absolute right-8 top-[28%] flex flex-col items-end gap-3 opacity-90">
          {['NR-35', 'NR-18', 'NR-06'].map((t, i) => (
            <Tag key={t} tone="ghost" className={i % 2 === 0 ? 'rotate-[-3deg]' : 'rotate-[2deg]'}>
              {t}
            </Tag>
          ))}
        </div>

        <img src="/logo-engecom.png" alt="ENGECOM" className="relative h-10 w-auto" />

        <div className="relative max-w-lg">
          <p className="eyebrow text-[var(--color-safety-400)] mb-4">Gestão de Segurança do Trabalho</p>
          <h1 className="font-extrabold leading-[0.95] mb-6 tracking-tight" style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)' }}>
            SEGURANÇA
            <br />
            EM
            <br />
            <span className="text-[var(--color-safety-400)]">OPERAÇÃO.</span>
          </h1>
          <div className="border-t border-dashed border-white/25 mb-5 w-24" />
          <p className="text-[var(--color-brand-200)] text-sm leading-relaxed max-w-sm">
            Rituais, DDS, inspeções, desvios e o Índice de Desenvolvimento de Segurança (IDS) da ENGECOM, reunidos em
            uma única plataforma corporativa.
          </p>
        </div>

        <p className="relative eyebrow text-[var(--color-brand-300)] tracking-normal normal-case font-normal">
          © {new Date().getFullYear()} ENGECOM
        </p>
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
