import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
router.use(authenticate);
router.use(authorize('dashboard', 'read'));

interface DashboardFilters {
  siteId?: string;
  sectorId?: string;
  responsibleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildDateWhere(filters: DashboardFilters, field = 'date') {
  if (!filters.dateFrom && !filters.dateTo) return {};
  return {
    [field]: {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
    },
  };
}

function buildScopeWhere(filters: DashboardFilters) {
  return {
    ...(filters.siteId ? { siteId: filters.siteId } : {}),
    ...(filters.sectorId ? { sectorId: filters.sectorId } : {}),
  };
}

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const filters = req.query as DashboardFilters;
    const scope = buildScopeWhere(filters);
    const dateWhere = buildDateWhere(filters);
    const responsibleWhere = filters.responsibleId ? { responsibleId: filters.responsibleId } : {};

    const [
      ddsCount,
      ritualsCount,
      inspectionsCount,
      deviationsTotal,
      deviationsOpen,
      deviationsResolved,
      incidentsCount,
      refusalRightsCount,
      actionPlansOpen,
      actionPlansOverdue,
      idsCurrent,
    ] = await Promise.all([
      prisma.dds.count({ where: { ...scope, ...dateWhere, ...responsibleWhere } }),
      prisma.ritual.count({ where: { ...scope, ...dateWhere, ...responsibleWhere } }),
      prisma.inspection.count({ where: { ...scope, ...dateWhere, ...responsibleWhere } }),
      prisma.deviation.count({ where: { ...scope, ...dateWhere, ...responsibleWhere } }),
      prisma.deviation.count({ where: { ...scope, ...dateWhere, ...responsibleWhere, status: { in: ['OPEN', 'IN_TREATMENT'] } } }),
      prisma.deviation.count({ where: { ...scope, ...dateWhere, ...responsibleWhere, status: 'RESOLVED' } }),
      prisma.incident.count({ where: { ...scope, ...dateWhere } }),
      prisma.refusalRight.count({ where: { ...scope, ...dateWhere } }),
      prisma.actionPlan.count({ where: { ...scope, ...responsibleWhere, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.actionPlan.count({ where: { ...scope, ...responsibleWhere, status: 'OVERDUE' } }),
      prisma.idsRecord.findFirst({ orderBy: { period: 'desc' } }),
    ]);

    const compliancePercentage = deviationsTotal > 0 ? Math.round((deviationsResolved / deviationsTotal) * 10000) / 100 : null;

    res.json({
      ids: idsCurrent
        ? {
            value: idsCurrent.value,
            target: idsCurrent.target,
            period: idsCurrent.period,
            classification: idsCurrent.classification,
          }
        : null,
      dds: ddsCount,
      rituals: ritualsCount,
      inspections: inspectionsCount,
      deviations: { total: deviationsTotal, open: deviationsOpen, resolved: deviationsResolved },
      incidents: incidentsCount,
      refusalRights: refusalRightsCount,
      actionPlans: { open: actionPlansOpen, overdue: actionPlansOverdue },
      compliancePercentage,
    });
  })
);

router.get(
  '/evolution',
  asyncHandler(async (req, res) => {
    const months = Math.min(Number(req.query.months) || 6, 24);
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const filters = req.query as DashboardFilters;
    const scope = buildScopeWhere(filters);

    const [dds, rituals, inspections, deviations] = await Promise.all([
      prisma.dds.findMany({ where: { ...scope, date: { gte: since } }, select: { date: true } }),
      prisma.ritual.findMany({ where: { ...scope, date: { gte: since } }, select: { date: true } }),
      prisma.inspection.findMany({ where: { ...scope, date: { gte: since } }, select: { date: true } }),
      prisma.deviation.findMany({ where: { ...scope, date: { gte: since } }, select: { date: true } }),
    ]);

    const buckets: Record<string, { period: string; dds: number; rituals: number; inspections: number; deviations: number }> = {};
    const cursor = new Date(since);
    for (let i = 0; i < months; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = { period: key, dds: 0, rituals: 0, inspections: 0, deviations: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }

    function bucketKey(date: Date) {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    dds.forEach((r) => { const b = buckets[bucketKey(r.date)]; if (b) b.dds++; });
    rituals.forEach((r) => { const b = buckets[bucketKey(r.date)]; if (b) b.rituals++; });
    inspections.forEach((r) => { const b = buckets[bucketKey(r.date)]; if (b) b.inspections++; });
    deviations.forEach((r) => { const b = buckets[bucketKey(r.date)]; if (b) b.deviations++; });

    res.json({ items: Object.values(buckets) });
  })
);

router.get(
  '/by-sector',
  asyncHandler(async (req, res) => {
    const filters = req.query as DashboardFilters;
    const dateWhere = buildDateWhere(filters);

    const sectors = await prisma.sector.findMany({ where: { active: true }, select: { id: true, name: true } });

    const results = await Promise.all(
      sectors.map(async (sector) => {
        const [deviationsCount, resolvedCount, inspectionsCount] = await Promise.all([
          prisma.deviation.count({ where: { sectorId: sector.id, ...dateWhere } }),
          prisma.deviation.count({ where: { sectorId: sector.id, ...dateWhere, status: 'RESOLVED' } }),
          prisma.inspection.count({ where: { sectorId: sector.id, ...dateWhere } }),
        ]);
        const performance = deviationsCount > 0 ? Math.round((resolvedCount / deviationsCount) * 10000) / 100 : null;
        return { sectorId: sector.id, sectorName: sector.name, deviations: deviationsCount, resolved: resolvedCount, inspections: inspectionsCount, performance };
      })
    );

    res.json({ items: results.filter((r) => r.deviations > 0 || r.inspections > 0) });
  })
);

export default router;
