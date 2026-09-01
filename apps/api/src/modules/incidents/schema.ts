import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const statusEnum = z.enum(['OPEN', 'INVESTIGATING', 'CLOSED']);

export const createIncidentSchema = z.object({
  date: dateStringSchema,
  time: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  siteId: optionalUuid,
  sectorId: optionalUuid,
  type: z.string().trim().min(2, 'Informe o tipo de incidente.'),
  description: z.string().trim().min(3, 'Descreva o incidente.'),
  involved: z.string().trim().optional().nullable(),
  consequences: z.string().trim().optional().nullable(),
  cause: z.string().trim().optional().nullable(),
  actionsTaken: z.string().trim().optional().nullable(),
  status: statusEnum.optional(),
});

export const updateIncidentSchema = createIncidentSchema.partial();
