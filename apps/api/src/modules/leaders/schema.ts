import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .regex(/[a-zA-Z]/, 'A senha deve conter letras.')
  .regex(/[0-9]/, 'A senha deve conter números.');

/**
 * hasSystemAccess decides whether email/password are required: a leader
 * who will never log in doesn't need either, while one who will needs
 * both, validated with the same rules as the Usuários module.
 */
export const createLeaderSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome completo.'),
    position: z.string().trim().optional(),
    hasSystemAccess: z.boolean().default(false),
    email: z.string().trim().email('Informe um e-mail válido.').optional(),
    password: passwordSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasSystemAccess) {
      if (!data.email) ctx.addIssue({ code: 'custom', path: ['email'], message: 'Informe o e-mail de acesso.' });
      if (!data.password) ctx.addIssue({ code: 'custom', path: ['password'], message: 'Informe a senha de acesso.' });
    }
  });

export const updateLeaderSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    position: z.string().trim().optional().nullable(),
    status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
    hasSystemAccess: z.boolean().optional(),
    email: z.string().trim().email('Informe um e-mail válido.').optional(),
    password: passwordSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasSystemAccess === true && !data.email) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'Informe o e-mail de acesso.' });
    }
  });

export const listLeadersQuerySchema = z.object({
  search: z.string().trim().optional(),
  sectorId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
});

export const createEvaluationSchema = z.object({
  date: z.string().optional(),
  leadershipScore: z.number().int().min(0).max(10),
  communicationScore: z.number().int().min(0).max(10),
  safetyCommitmentScore: z.number().int().min(0).max(10),
  notes: z.string().trim().max(2000).optional(),
});
