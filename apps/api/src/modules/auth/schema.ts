import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token inválido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres.')
    .regex(/[a-zA-Z]/, 'A senha deve conter letras.')
    .regex(/[0-9]/, 'A senha deve conter números.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve ter ao menos 8 caracteres.')
    .regex(/[a-zA-Z]/, 'A senha deve conter letras.')
    .regex(/[0-9]/, 'A senha deve conter números.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo.').optional(),
  avatarUrl: z.string().trim().url('URL inválida.').optional().nullable(),
});
