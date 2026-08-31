import { prisma } from '../../lib/prisma';
import { PeriodRange, previousPeriod } from './period';
import { RANKING_WEIGHTS, ScoreComponentKey, classifyScore, combineScores, rateScore, relativeScore } from './scoring';

export interface RankingFilters {
  range: PeriodRange;
  sectorId?: string;
  siteId?: string;
}

export interface LeaderMetrics {
  ddsCount: number;
  inspectionsCount: number;
  deviationsFound: number;
  deviationsResolved: number;
  deviationsResolutionRate: number;
  actionPlansDue: number;
  actionPlansOnTime: number;
  actionPlansOnTimeRate: number;
  actionPlansOverdue: number;
  incidentsCount: number;
  managerialInspectionAvgPercentage: number | null;
}

export interface ScoreComponentView {
  raw: number | null;
  score: number | null;
  weight: number;
}

export interface LeaderRankingEntry {
  userId: string;
  name: string;
  position: number;
  sectorNames: string[];
  siteNames: string[];
  score: number;
  classification: string;
  metrics: LeaderMetrics;
  scoreBreakdown: Record<ScoreComponentKey, ScoreComponentView>;
}

interface LeaderContext {
  id: string;
  name: string;
  sectorIds: string[];
  sectorNames: string[];
  siteNames: string[];
}

async function resolveLeaders(filters: RankingFilters): Promise<LeaderContext[]> {
  const leaders = await prisma.user.findMany({
    where: {
      role: 'LEADERSHIP',
      status: 'ACTIVE',
      ...(filters.sectorId
        ? { sectorsLed: { some: { id: filters.sectorId } } }
        : filters.siteId
          ? { sectorsLed: { some: { siteId: filters.siteId } } }
          : {}),
    },
    select: {
      id: true,
      name: true,
      sectorsLed: {
        where: { active: true },
        select: { id: true, name: true, siteId: true, site: { select: { name: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  return leaders.map((leader) => {
    const effective = leader.sectorsLed.filter(
      (s) => (!filters.sectorId || s.id === filters.sectorId) && (!filters.siteId || s.siteId === filters.siteId)
    );
    return {
      id: leader.id,
      name: leader.name,
      sectorIds: effective.map((s) => s.id),
      sectorNames: effective.map((s) => s.name),
      siteNames: [...new Set(effective.map((s) => s.site?.name).filter((n): n is string => Boolean(n)))],
    };
  });
}

function recordScope(filters: RankingFilters) {
  return {
    ...(filters.sectorId ? { sectorId: filters.sectorId } : {}),
    ...(filters.siteId ? { siteId: filters.siteId } : {}),
  };
}

async function gatherMetrics(leader: LeaderContext, filters: RankingFilters): Promise<LeaderMetrics> {
  const { from, to } = filters.range;
  const scope = recordScope(filters);
  const dateRange = { gte: from, lte: to };

  const [ddsCount, inspectionsCount, deviationsFound, deviationsResolved, actionPlans, incidentsCount, managerialInspections] =
    await Promise.all([
      prisma.dds.count({ where: { responsibleId: leader.id, date: dateRange, ...scope } }),
      prisma.inspection.count({ where: { responsibleId: leader.id, date: dateRange, ...scope } }),
      prisma.deviation.count({ where: { responsibleId: leader.id, date: dateRange, ...scope } }),
      prisma.deviation.count({ where: { responsibleId: leader.id, date: dateRange, ...scope, status: 'RESOLVED' } }),
      prisma.actionPlan.findMany({
        where: { responsibleId: leader.id, dueDate: dateRange, ...scope },
        select: { status: true, dueDate: true, completedAt: true },
      }),
      leader.sectorIds.length > 0
        ? prisma.incident.count({ where: { sectorId: { in: leader.sectorIds }, date: dateRange } })
        : Promise.resolve(0),
      leader.sectorIds.length > 0
        ? prisma.managerialInspection.findMany({
            where: { sectorId: { in: leader.sectorIds }, date: dateRange },
            select: { percentage: true },
          })
        : Promise.resolve([]),
    ]);

  const actionPlansDue = actionPlans.length;
  const actionPlansOnTime = actionPlans.filter(
    (p) => p.status === 'COMPLETED' && p.completedAt && p.dueDate && p.completedAt <= p.dueDate
  ).length;
  const actionPlansOverdue = actionPlans.filter((p) => p.status === 'OVERDUE').length;

  const managerialInspectionAvgPercentage =
    managerialInspections.length > 0
      ? Math.round((managerialInspections.reduce((sum, m) => sum + m.percentage, 0) / managerialInspections.length) * 100) / 100
      : null;

  return {
    ddsCount,
    inspectionsCount,
    deviationsFound,
    deviationsResolved,
    deviationsResolutionRate: rateScore(deviationsResolved, deviationsFound),
    actionPlansDue,
    actionPlansOnTime,
    actionPlansOnTimeRate: rateScore(actionPlansOnTime, actionPlansDue),
    actionPlansOverdue,
    incidentsCount,
    managerialInspectionAvgPercentage,
  };
}

function buildScoreBreakdown(
  metrics: LeaderMetrics,
  maxDds: number,
  maxInspections: number,
  maxIncidents: number
): Record<ScoreComponentKey, ScoreComponentView> {
  return {
    dds: { raw: metrics.ddsCount, score: relativeScore(metrics.ddsCount, maxDds), weight: RANKING_WEIGHTS.dds },
    inspections: {
      raw: metrics.inspectionsCount,
      score: relativeScore(metrics.inspectionsCount, maxInspections),
      weight: RANKING_WEIGHTS.inspections,
    },
    deviationsTreated: {
      raw: metrics.deviationsFound,
      score: metrics.deviationsResolutionRate,
      weight: RANKING_WEIGHTS.deviationsTreated,
    },
    actionPlansOnTime: {
      raw: metrics.actionPlansDue,
      score: metrics.actionPlansOnTimeRate,
      weight: RANKING_WEIGHTS.actionPlansOnTime,
    },
    incidents: {
      raw: metrics.incidentsCount,
      score: 100 - relativeScore(metrics.incidentsCount, maxIncidents),
      weight: RANKING_WEIGHTS.incidents,
    },
    inspectionResult: {
      raw: metrics.managerialInspectionAvgPercentage,
      score: metrics.managerialInspectionAvgPercentage,
      weight: RANKING_WEIGHTS.inspectionResult,
    },
  };
}

async function computeForRange(filters: RankingFilters): Promise<LeaderRankingEntry[]> {
  const leaders = await resolveLeaders(filters);
  if (leaders.length === 0) return [];

  const metricsByLeader = await Promise.all(leaders.map((leader) => gatherMetrics(leader, filters)));

  const maxDds = Math.max(0, ...metricsByLeader.map((m) => m.ddsCount));
  const maxInspections = Math.max(0, ...metricsByLeader.map((m) => m.inspectionsCount));
  const maxIncidents = Math.max(0, ...metricsByLeader.map((m) => m.incidentsCount));

  const unranked = leaders.map((leader, i) => {
    const metrics = metricsByLeader[i];
    const scoreBreakdown = buildScoreBreakdown(metrics, maxDds, maxInspections, maxIncidents);
    const score = combineScores(scoreBreakdown);
    return {
      userId: leader.id,
      name: leader.name,
      position: 0,
      sectorNames: leader.sectorNames,
      siteNames: leader.siteNames,
      score,
      classification: classifyScore(score),
      metrics,
      scoreBreakdown,
    } satisfies Omit<LeaderRankingEntry, 'position'> & { position: number };
  });

  unranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  unranked.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return unranked;
}

/** A leader counts as "having data" if any of their raw activity counters is non-zero. */
function hasActivity(entry: LeaderRankingEntry): boolean {
  const m = entry.metrics;
  return (
    m.ddsCount > 0 ||
    m.inspectionsCount > 0 ||
    m.deviationsFound > 0 ||
    m.actionPlansDue > 0 ||
    m.incidentsCount > 0 ||
    m.managerialInspectionAvgPercentage !== null
  );
}

export interface RankingResult {
  items: LeaderRankingEntry[];
  hasSufficientData: boolean;
  previousPositions: Record<string, number>;
  previousScores: Record<string, number>;
}

export async function getLeadershipRanking(filters: RankingFilters): Promise<RankingResult> {
  const current = await computeForRange(filters);
  const hasSufficientData = current.some(hasActivity);

  const previous = await computeForRange({ ...filters, range: previousPeriod(filters.range) });
  const previousPositions: Record<string, number> = {};
  const previousScores: Record<string, number> = {};
  previous.forEach((entry) => {
    previousPositions[entry.userId] = entry.position;
    previousScores[entry.userId] = entry.score;
  });

  return { items: current, hasSufficientData, previousPositions, previousScores };
}

/**
 * Detail view for a single leader. Deliberately computed against the FULL
 * group (same filters, no leaderId restriction) so the relative components
 * (DDS, inspeções, incidentes) keep the same group-max normalization as the
 * general ranking — scoring one leader in isolation would make every
 * relative component trivially 100 or 0.
 */
export async function getLeaderDetail(userId: string, filters: RankingFilters) {
  const result = await getLeadershipRanking(filters);
  const entry = result.items.find((item) => item.userId === userId) ?? null;
  if (!entry) return null;

  return {
    entry,
    previousPosition: result.previousPositions[userId] ?? null,
    previousScore: result.previousScores[userId] ?? null,
  };
}

export interface ScoreHistoryPoint {
  period: string; // "AAAA-MM"
  score: number | null;
}

/**
 * Últimos `months` fechamentos mensais da pontuação de um líder, para o
 * gráfico simples de evolução na tela de detalhe. Cada mês é recomputado
 * contra o grupo inteiro de líderes daquele mês (mesma regra de
 * normalização relativa da listagem principal).
 */
export async function getLeaderScoreHistory(
  userId: string,
  baseFilters: Omit<RankingFilters, 'range'>,
  months = 6
): Promise<ScoreHistoryPoint[]> {
  const now = new Date();
  const points: ScoreHistoryPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;

    const entries = await computeForRange({ ...baseFilters, range: { from, to } });
    const entry = entries.find((e) => e.userId === userId);
    points.push({ period: label, score: entry?.score ?? null });
  }

  return points;
}
