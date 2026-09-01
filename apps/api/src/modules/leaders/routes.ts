import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createEvaluation,
  createLeader,
  deleteLeader,
  getLeader,
  listEvaluations,
  listLeaders,
  updateLeader,
} from './controller';
import { createEvaluationSchema, createLeaderSchema, listLeadersQuerySchema, updateLeaderSchema } from './schema';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

router.get('/', authorize('leaders', 'read'), validate({ query: listLeadersQuerySchema }), listLeaders);
router.get('/:id', authorize('leaders', 'read'), validate({ params: idParamSchema }), getLeader);
router.post('/', authorize('leaders', 'create'), validate({ body: createLeaderSchema }), createLeader);
router.patch('/:id', authorize('leaders', 'update'), validate({ params: idParamSchema, body: updateLeaderSchema }), updateLeader);
router.delete('/:id', authorize('leaders', 'delete'), validate({ params: idParamSchema }), deleteLeader);

router.get('/:id/evaluations', authorize('leaderEvaluations', 'read'), validate({ params: idParamSchema }), listEvaluations);
router.post(
  '/:id/evaluations',
  authorize('leaderEvaluations', 'create'),
  validate({ params: idParamSchema, body: createEvaluationSchema }),
  createEvaluation
);

export default router;
