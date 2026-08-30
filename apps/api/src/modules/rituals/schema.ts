import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const statusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELED']);

export const createRitualSchema = z.object({
  date: dateStringSchema,
  time: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  siteId: optionalUuid,
  sectorId: optionalUuid,
  responsibleId: optionalUuid,
  type: z.string().trim().min(2, 'Informe o tipo de ritual.'),
  participants: z.string().trim().optional().nullable(),
  participantsCount: z.coerce.number().int().min(0).optional().nullable(),
  theme: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: statusEnum.optional(),
});

export const updateRitualSchema = createRitualSchema.partial();
