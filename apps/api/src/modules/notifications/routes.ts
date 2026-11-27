import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { notifyRoles, notifyUsers } from '../../lib/notify';
import { recordAudit } from '../../lib/audit';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize('notifications', 'read'),
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unreadOnly === 'true';
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);

    const where = { userId: req.user!.id, ...(unreadOnly ? { read: false } : {}) };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    res.json({ items, total, page, pageSize, unreadCount });
  })
);

router.patch(
  '/:id/read',
  authorize('notifications', 'update'),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { read: true },
    });
    if (notification.count === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notificação não encontrada.' } });
    res.json({ message: 'Notificação marcada como lida.' });
  })
);

router.post(
  '/read-all',
  authorize('notifications', 'update'),
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  })
);

const broadcastSchema = z.object({
  title: z.string().trim().min(2),
  message: z.string().trim().min(2),
  roles: z.array(z.enum(['ADMIN', 'SAFETY_ENGINEER', 'SAFETY_TECHNICIAN', 'LEADERSHIP'])).optional(),
  userIds: z.array(z.string().uuid()).optional(),
});

router.post(
  '/broadcast',
  authorize('notifications', 'create'),
  validate({ body: broadcastSchema }),
  asyncHandler(async (req, res) => {
    const { title, message, roles, userIds } = req.body;

    if (roles?.length) {
      await notifyRoles(roles, { type: 'ADMIN_NOTICE', title, message });
    }
    if (userIds?.length) {
      await notifyUsers(userIds, { type: 'ADMIN_NOTICE', title, message });
    }

    await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'notifications', req, details: { title, roles, userIds } });
    res.status(201).json({ message: 'Aviso enviado.' });
  })
);

export default router;
