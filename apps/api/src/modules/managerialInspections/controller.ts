import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { asyncHandler } from '../../utils/asyncHandler';
import { NotFoundError } from '../../utils/errors';
import { computeChecklistScore } from './scoring';

const include = {
  sector: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  attachments: true,
};

export const listManagerialInspections = asyncHandler(async (req: Request, res: Response) => {
  const { search, sectorId, dateFrom, dateTo, page = '1', pageSize = '20', sortBy = 'date', sortDir = 'desc' } = req.query as Record<string, string>;

  const where: any = {};
  if (sectorId) where.sectorId = sectorId;
  if (search) {
    where.OR = [
      { team: { contains: search, mode: 'insensitive' } },
      { nonConformities: { contains: search, mode: 'insensitive' } },
      { classification: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.date = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  const pageNum = Number(page) || 1;
  const pageSizeNum = Math.min(Number(pageSize) || 20, 200);

  const [items, total] = await Promise.all([
    prisma.managerialInspection.findMany({
      where,
      include,
      orderBy: { [sortBy]: sortDir },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    }),
    prisma.managerialInspection.count({ where }),
  ]);

  res.json({ items, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.max(1, Math.ceil(total / pageSizeNum)) });
});

export const getManagerialInspection = asyncHandler(async (req: Request, res: Response) => {
  const record = await prisma.managerialInspection.findUnique({ where: { id: req.params.id }, include });
  if (!record) throw new NotFoundError();
  res.json({ item: record });
});

export const createManagerialInspection = asyncHandler(async (req: Request, res: Response) => {
  const { date, team, sectorId, checklist, nonConformities, notes } = req.body;
  const score = computeChecklistScore(checklist);

  const record = await prisma.managerialInspection.create({
    data: {
      date,
      team,
      sectorId,
      checklist,
      nonConformities,
      notes,
      ...score,
      createdById: req.user!.id,
    },
    include,
  });

  await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'managerialInspections', recordId: record.id, req });
  res.status(201).json({ item: record });
});

export const updateManagerialInspection = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.managerialInspection.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError();

  const score = req.body.checklist ? computeChecklistScore(req.body.checklist) : {};

  const record = await prisma.managerialInspection.update({
    where: { id: req.params.id },
    data: { ...req.body, ...score },
    include,
  });

  await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'managerialInspections', recordId: record.id, req });
  res.json({ item: record });
});

export const deleteManagerialInspection = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.managerialInspection.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError();

  await prisma.managerialInspection.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'managerialInspections', recordId: req.params.id, req });
  res.status(204).send();
});
