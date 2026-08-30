import { z } from 'zod';
import { dateStringSchema, optionalUuid } from '../../utils/zodHelpers';

export const checklistItemSchema = z.object({
  item: z.string().trim().min(1),
  weight: z.coerce.number().min(0).default(1),
  conforme: z.boolean().nullable(), // null = não aplicável
  observacao: z.string().trim().optional().nullable(),
});

export const createManagerialInspectionSchema = z.object({
  date: dateStringSchema,
  team: z.string().trim().optional().nullable(),
  sectorId: optionalUuid,
  checklist: z.array(checklistItemSchema).min(1, 'Adicione ao menos um item ao checklist.'),
  nonConformities: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateManagerialInspectionSchema = createManagerialInspectionSchema.partial();
