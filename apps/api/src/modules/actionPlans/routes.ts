import { Router } from 'express';
import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { notifyUser } from '../../lib/notify';
import { asyncHandler } from '../../utils/asyncHandler';
import { createActionPlanSchema, updateActionPlanSchema } from './schema';
import { runActionPlanAlerts } from './alerts';

const router = Router();

router.use(
  asyncHandler(async (_req, _res, next) => {
    // Best-effort housekeeping so lists/dashboards reflect overdue plans
    // even between scheduled runs. Never blocks the request on failure.
    runActionPlanAlerts().catch((err) => console.error('runActionPlanAlerts failed:', err));
    next();
  })
);

router.use(
  createCrudRouter({
    module: 'actionPlans',
    model: 'actionPlan',
    searchFields: ['action', 'origin', 'notes'],
    dateField: 'dueDate',
    include: commonRelationsInclude,
    defaultSort: { field: 'dueDate', dir: 'asc' },
    createSchema: createActionPlanSchema,
    updateSchema: updateActionPlanSchema,
    filters: [
      { param: 'sectorId', build: (v) => ({ sectorId: v }) },
      { param: 'siteId', build: (v) => ({ siteId: v }) },
      { param: 'status', build: (v) => ({ status: v }) },
      { param: 'priority', build: (v) => ({ priority: v }) },
      { param: 'responsibleId', build: (v) => ({ responsibleId: v }) },
    ],
    beforeUpdate: (data: any, previous: any) => {
      if (data.status === 'COMPLETED' && previous.status !== 'COMPLETED' && !data.completedAt) {
        data.completedAt = new Date();
      }
      if (data.status && data.status !== 'COMPLETED' && previous.status === 'COMPLETED') {
        data.completedAt = null;
      }
      return data;
    },
    afterCreate: async (record) => {
      if (record.responsibleId) {
        await notifyUser({
          userId: record.responsibleId,
          type: 'NEW_ASSIGNMENT',
          title: 'Novo plano de ação atribuído',
          message: `Você foi definido como responsável pela ação: "${record.action}".`,
          link: `/planos-de-acao/${record.id}`,
        });
      }
    },
    afterUpdate: async (record, previous) => {
      if (record.responsibleId && record.responsibleId !== previous.responsibleId) {
        await notifyUser({
          userId: record.responsibleId,
          type: 'NEW_ASSIGNMENT',
          title: 'Plano de ação atribuído a você',
          message: `Você foi definido como responsável pela ação: "${record.action}".`,
          link: `/planos-de-acao/${record.id}`,
        });
      }
    },
  })
);

export default router;
