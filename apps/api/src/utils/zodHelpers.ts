import { z } from 'zod';

export const dateStringSchema = z.coerce.date({ errorMap: () => ({ message: 'Informe uma data válida.' }) });
export const optionalUuid = z.string().uuid('Seleção inválida.').optional().nullable();
export const requiredUuid = z.string().uuid('Seleção obrigatória.');

export const personSelect = { id: true, name: true, email: true, role: true } as const;

export const commonRelationsInclude = {
  site: { select: { id: true, name: true } },
  sector: { select: { id: true, name: true } },
  responsible: { select: personSelect },
  createdBy: { select: personSelect },
  attachments: true,
};
