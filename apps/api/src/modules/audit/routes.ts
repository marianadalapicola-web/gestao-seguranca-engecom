import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  authorize('audit', 'read'),
  asyncHandler(async (req, res) => {
    const { userId, module, action, dateFrom, dateTo, page = '1', pageSize = '25' } = req.query as Record<string, string>;

    const where: any = {};
    if (userId) where.userId = userId;
    if (module) where.module = module;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
      };
    }

    const pageNum = Number(page) || 1;
    const pageSizeNum = Math.min(Number(pageSize) || 25, 200);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ items, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.max(1, Math.ceil(total / pageSizeNum)) });
  })
);

export default router;
