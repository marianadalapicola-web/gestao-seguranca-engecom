import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit } from '../../lib/audit';
import { ConflictError, NotFoundError } from '../../utils/errors';

const router = Router();
router.use(authenticate);

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do setor.'),
  siteId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
});
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/',
  authorize('sectors', 'read'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const siteId = req.query.siteId as string | undefined;
    const sectors = await prisma.sector.findMany({
      where: {
        ...(includeInactive ? {} : { active: true }),
        ...(siteId ? { siteId } : {}),
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ items: sectors });
  })
);

router.post(
  '/',
  authorize('sectors', 'create'),
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    try {
      const sector = await prisma.sector.create({ data: req.body });
      await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'sectors', recordId: sector.id, req });
      res.status(201).json({ sector });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Já existe um setor com este nome nesta obra.');
      }
      throw err;
    }
  })
);

router.patch(
  '/:id',
  authorize('sectors', 'update'),
  validate({ params: idParamSchema, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const sector = await prisma.sector.findUnique({ where: { id: req.params.id } });
    if (!sector) throw new NotFoundError('Setor não encontrado.');
    const updated = await prisma.sector.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'sectors', recordId: sector.id, req });
    res.json({ sector: updated });
  })
);

router.delete(
  '/:id',
  authorize('sectors', 'delete'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const sector = await prisma.sector.findUnique({ where: { id: req.params.id } });
    if (!sector) throw new NotFoundError('Setor não encontrado.');
    await prisma.sector.update({ where: { id: req.params.id }, data: { active: false } });
    await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'sectors', recordId: sector.id, req });
    res.status(204).send();
  })
);

export default router;
