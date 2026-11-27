import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const statusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'PENDING', 'CANCELED']);

const checklistItemSchema = z.object({
  item: z.string(),
  conforme: z.boolean().nullable().optional(),
  observacao: z.string().optional(),
});

export const createInspectionSchema = z.object({
  date: dateStringSchema,
  type: z.string().trim().min(2, 'Informe o tipo de inspeção.'),
  siteId: optionalUuid,
  sectorId: optionalUuid,
  responsibleId: optionalUuid,
  checklist: z.array(checklistItemSchema).optional(),
  result: z.string().trim().optional().nullable(),
  status: statusEnum.optional(),
  notes: z.string().trim().optional().nullable(),
});

export const updateInspectionSchema = createInspectionSchema.partial();
