import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const statusEnum = z.enum(['OPEN', 'IN_TREATMENT', 'RESOLVED', 'CANCELED']);

export const createDeviationSchema = z.object({
  date: dateStringSchema,
  location: z.string().trim().optional().nullable(),
  siteId: optionalUuid,
  sectorId: optionalUuid,
  category: z.string().trim().min(2, 'Informe a categoria do desvio.'),
  description: z.string().trim().min(3, 'Descreva o desvio.'),
  severity: severityEnum.optional(),
  responsibleId: optionalUuid,
  dueDate: dateStringSchema.optional().nullable(),
  status: statusEnum.optional(),
});

export const updateDeviationSchema = createDeviationSchema.partial().extend({
  actionPlanId: optionalUuid,
});
