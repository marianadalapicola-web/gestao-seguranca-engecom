import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { NotFoundError } from '../../utils/errors';
import { resolvePeriod } from './period';
import { getLeaderDetail, getLeaderScoreHistory, getLeadershipRanking, LeaderRankingEntry } from './service';

const router = Router();
router.use(authenticate);
router.use(authorize('leadershipRanking', 'read'));

const filtersQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sectorId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
});

function buildFilters(query: z.infer<typeof filtersQuerySchema>) {
  const range = resolvePeriod(query.period ?? 'month', query.dateFrom, query.dateTo);
  return { range, sectorId: query.sectorId, siteId: query.siteId };
}

interface WithEvolution {
  evolution: 'up' | 'down' | 'same' | 'new';
  positionDelta: number;
  previousPosition: number | null;
  previousScore: number | null;
}

function attachEvolution(
  entry: LeaderRankingEntry,
  previousPositions: Record<string, number>,
  previousScores: Record<string, number>
): LeaderRankingEntry & WithEvolution {
  const previousPosition = previousPositions[entry.userId] ?? null;
  const previousScore = previousScores[entry.userId] ?? null;

  let evolution: WithEvolution['evolution'] = 'new';
  let positionDelta = 0;
  if (previousPosition !== null) {
    positionDelta = previousPosition - entry.position;
    evolution = positionDelta > 0 ? 'up' : positionDelta < 0 ? 'down' : 'same';
  }

  return { ...entry, evolution, positionDelta, previousPosition, previousScore };
}

router.get(
  '/',
  validate({ query: filtersQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = buildFilters(req.query as z.infer<typeof filtersQuerySchema>);
    const result = await getLeadershipRanking(filters);

    res.json({
      items: result.items.map((entry) => attachEvolution(entry, result.previousPositions, result.previousScores)),
      hasSufficientData: result.hasSufficientData,
      range: filters.range,
    });
  })
);

router.get(
  '/summary',
  validate({ query: filtersQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = buildFilters(req.query as z.infer<typeof filtersQuerySchema>);
    const result = await getLeadershipRanking(filters);

    if (!result.hasSufficientData) {
      res.json({ hasSufficientData: false, top: [], bestEvolution: null });
      return;
    }

    const withEvolution = result.items.map((entry) => attachEvolution(entry, result.previousPositions, result.previousScores));
    const top = withEvolution.slice(0, 3);
    const bestEvolution = [...withEvolution]
      .filter((e) => e.previousScore !== null)
      .sort((a, b) => b.score - (b.previousScore ?? 0) - (a.score - (a.previousScore ?? 0)))[0];

    res.json({
      hasSufficientData: true,
      top,
      bestEvolution: bestEvolution
        ? { name: bestEvolution.name, delta: Math.round((bestEvolution.score - (bestEvolution.previousScore ?? 0)) * 100) / 100 }
        : null,
    });
  })
);

router.get(
  '/:userId',
  validate({ params: z.object({ userId: z.string().uuid() }), query: filtersQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = buildFilters(req.query as z.infer<typeof filtersQuerySchema>);
    const detail = await getLeaderDetail(req.params.userId, filters);
    if (!detail) throw new NotFoundError('Líder não encontrado ou sem participação no ranking deste período.');

    const history = await getLeaderScoreHistory(req.params.userId, { sectorId: filters.sectorId, siteId: filters.siteId });

    const previousPositions = detail.previousPosition !== null ? { [detail.entry.userId]: detail.previousPosition } : {};
    const previousScores = detail.previousScore !== null ? { [detail.entry.userId]: detail.previousScore } : {};

    res.json({
      ...attachEvolution(detail.entry, previousPositions, previousScores),
      history,
    });
  })
);

export default router;
