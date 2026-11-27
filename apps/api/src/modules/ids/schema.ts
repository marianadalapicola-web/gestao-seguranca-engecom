import { z } from 'zod';

export const idsConfigSchema = z.object({
  formulaDescription: z.string().trim().optional().nullable(),
  weights: z.record(z.string(), z.number()).optional().nullable(),
});

export const idsRecordSchema = z.object({
  period: z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o período no formato AAAA-MM.'),
  value: z.coerce.number().optional().nullable(),
  target: z.coerce.number().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});
