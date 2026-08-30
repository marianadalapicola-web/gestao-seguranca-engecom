import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit } from '../../lib/audit';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

const router = Router();
router.use(authenticate);

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da obra/unidade.'),
  active: z.boolean().optional(),
});
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/',
  authorize('sites', 'read'),
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const sites = await prisma.site.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
    });
    res.json({ items: sites });
  })
);

router.post(
  '/',
  authorize('sites', 'create'),
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    try {
      const site = await prisma.site.create({ data: req.body });
      await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'sites', recordId: site.id, req });
      res.status(201).json({ site });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('Já existe uma obra/unidade com este nome.');
      }
      throw err;
    }
  })
);

router.patch(
  '/:id',
  authorize('sites', 'update'),
  validate({ params: idParamSchema, body: bodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findUnique({ where: { id: req.params.id } });
    if (!site) throw new NotFoundError('Obra/unidade não encontrada.');
    const updated = await prisma.site.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'sites', recordId: site.id, req });
    res.json({ site: updated });
  })
);

router.delete(
  '/:id',
  authorize('sites', 'delete'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const site = await prisma.site.findUnique({ where: { id: req.params.id } });
    if (!site) throw new NotFoundError('Obra/unidade não encontrada.');
    await prisma.site.update({ where: { id: req.params.id }, data: { active: false } });
    await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'sites', recordId: site.id, req });
    res.status(204).send();
  })
);

export default router;
