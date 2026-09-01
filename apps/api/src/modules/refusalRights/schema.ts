import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const statusEnum = z.enum(['OPEN', 'IN_ANALYSIS', 'TREATED', 'CLOSED']);

export const createRefusalRightSchema = z.object({
  date: dateStringSchema,
  workerName: z.string().trim().min(2, 'Informe o nome do trabalhador.'),
  sectorId: optionalUuid,
  siteId: optionalUuid,
  location: z.string().trim().optional().nullable(),
  activity: z.string().trim().optional().nullable(),
  reason: z.string().trim().min(3, 'Descreva o motivo da recusa.'),
  identifiedRisk: z.string().trim().optional().nullable(),
  measuresAdopted: z.string().trim().optional().nullable(),
  responsibleId: optionalUuid,
  status: statusEnum.optional(),
});

export const updateRefusalRightSchema = createRefusalRightSchema.partial();
