import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { asyncHandler } from '../../utils/asyncHandler';

function classify(percentAchieved: number | null): string | null {
  if (percentAchieved === null) return null;
  if (percentAchieved >= 100) return 'Meta Atingida';
  if (percentAchieved >= 90) return 'Próximo da Meta';
  if (percentAchieved >= 70) return 'Atenção';
  return 'Crítico';
}

export const getIdsConfig = asyncHandler(async (_req: Request, res: Response) => {
  let config = await prisma.idsConfig.findFirst({ where: { active: true }, orderBy: { version: 'desc' } });
  if (!config) {
    config = await prisma.idsConfig.create({
      data: {
        version: 1,
        active: true,
        formulaDescription:
          'Fórmula oficial do IDS ainda não configurada. Defina os pesos e critérios da ENGECOM para habilitar o cálculo automático.',
        weights: {},
      },
    });
  }
  res.json({ config });
});

export const updateIdsConfig = asyncHandler(async (req: Request, res: Response) => {
  const current = await prisma.idsConfig.findFirst({ where: { active: true }, orderBy: { version: 'desc' } });

  const config = current
    ? await prisma.idsConfig.update({ where: { id: current.id }, data: req.body })
    : await prisma.idsConfig.create({ data: { version: 1, active: true, ...req.body } });

  await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'ids', recordId: config.id, req });
  res.json({ config });
});

export const listIdsRecords = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', pageSize = '24' } = req.query as Record<string, string>;
  const pageNum = Number(page) || 1;
  const pageSizeNum = Math.min(Number(pageSize) || 24, 120);

  const [items, total] = await Promise.all([
    prisma.idsRecord.findMany({
      orderBy: { period: 'desc' },
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    }),
    prisma.idsRecord.count(),
  ]);

  const enriched = items.map((r) => ({
    ...r,
    percentAchieved: r.value !== null && r.target ? Math.round((r.value / r.target) * 10000) / 100 : null,
  }));

  res.json({ items: enriched, total, page: pageNum, pageSize: pageSizeNum, totalPages: Math.max(1, Math.ceil(total / pageSizeNum)) });
});

export const upsertIdsRecord = asyncHandler(async (req: Request, res: Response) => {
  const { period, value, target, notes } = req.body;
  const percentAchieved = value !== null && value !== undefined && target ? (value / target) * 100 : null;

  const config = await prisma.idsConfig.findFirst({ where: { active: true } });

  const record = await prisma.idsRecord.upsert({
    where: { period },
    create: {
      period,
      value,
      target,
      notes,
      classification: classify(percentAchieved),
      weightsSnapshot: config?.weights ?? undefined,
    },
    update: {
      value,
      target,
      notes,
      classification: classify(percentAchieved),
    },
  });

  await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'ids', recordId: record.id, req, details: { period } });
  res.json({ item: record });
});

export const deleteIdsRecord = asyncHandler(async (req: Request, res: Response) => {
  await prisma.idsRecord.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'ids', recordId: req.params.id, req });
  res.status(204).send();
});

export const getIdsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const records = await prisma.idsRecord.findMany({ orderBy: { period: 'desc' }, take: 13 });
  const [current, previous] = records;

  const currentPercent =
    current?.value !== null && current?.value !== undefined && current?.target
      ? (current.value / current.target) * 100
      : null;

  res.json({
    current: current
      ? { ...current, percentAchieved: currentPercent !== null ? Math.round(currentPercent * 100) / 100 : null }
      : null,
    previous: previous ?? null,
    history: [...records].reverse(),
  });
});
