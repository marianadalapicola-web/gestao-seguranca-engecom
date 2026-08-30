import { z } from 'zod';
import { optionalUuid } from '../../utils/zodHelpers';

export const createIndicatorSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do indicador.'),
  unit: z.string().trim().optional().nullable(),
  targetValue: z.coerce.number().optional().nullable(),
  resultValue: z.coerce.number().optional().nullable(),
  period: z.string().trim().min(4, 'Informe o período (ex.: 2026-01).'),
  sectorId: optionalUuid,
  siteId: optionalUuid,
  responsibleId: optionalUuid,
  status: z.string().trim().optional().nullable(),
});

export const updateIndicatorSchema = createIndicatorSchema.partial();
