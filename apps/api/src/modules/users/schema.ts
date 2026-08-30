import { z } from 'zod';

export const roleEnum = z.enum(['ADMIN', 'SAFETY_ENGINEER', 'SAFETY_TECHNICIAN', 'LEADERSHIP']);
export const statusEnum = z.enum(['ACTIVE', 'BLOCKED']);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres.')
    .regex(/[a-zA-Z]/, 'A senha deve conter letras.')
    .regex(/[0-9]/, 'A senha deve conter números.'),
  role: roleEnum,
  position: z.string().trim().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  position: z.string().trim().optional().nullable(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'email', 'role', 'status', 'lastLoginAt', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});
