import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createManagerialInspection,
  deleteManagerialInspection,
  getManagerialInspection,
  listManagerialInspections,
  updateManagerialInspection,
} from './controller';
import { createManagerialInspectionSchema, updateManagerialInspectionSchema } from './schema';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

router.get('/', authorize('managerialInspections', 'read'), listManagerialInspections);
router.get('/:id', authorize('managerialInspections', 'read'), validate({ params: idParamSchema }), getManagerialInspection);
router.post(
  '/',
  authorize('managerialInspections', 'create'),
  validate({ body: createManagerialInspectionSchema }),
  createManagerialInspection
);
router.patch(
  '/:id',
  authorize('managerialInspections', 'update'),
  validate({ params: idParamSchema, body: updateManagerialInspectionSchema }),
  updateManagerialInspection
);
router.delete(
  '/:id',
  authorize('managerialInspections', 'delete'),
  validate({ params: idParamSchema }),
  deleteManagerialInspection
);

export default router;
