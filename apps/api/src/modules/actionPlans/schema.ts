import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELED']);

export const createActionPlanSchema = z.object({
  action: z.string().trim().min(3, 'Descreva a ação.'),
  origin: z.string().trim().optional().nullable(),
  originModule: z.string().trim().optional().nullable(),
  originId: z.string().trim().optional().nullable(),
  responsibleId: optionalUuid,
  sectorId: optionalUuid,
  siteId: optionalUuid,
  dueDate: dateStringSchema.optional().nullable(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  notes: z.string().trim().optional().nullable(),
});

export const updateActionPlanSchema = createActionPlanSchema.partial().extend({
  completedAt: dateStringSchema.optional().nullable(),
});
