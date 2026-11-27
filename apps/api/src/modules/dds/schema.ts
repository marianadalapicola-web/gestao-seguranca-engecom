import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const createDdsSchema = z.object({
  date: dateStringSchema,
  theme: z.string().trim().min(2, 'Informe o tema do DDS.'),
  responsibleId: optionalUuid,
  siteId: optionalUuid,
  sectorId: optionalUuid,
  participants: z.string().trim().optional().nullable(),
  participantsCount: z.coerce.number().int().min(0).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateDdsSchema = createDdsSchema.partial();
