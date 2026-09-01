import { Request } from 'express';
import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { notifyUser } from '../../lib/notify';
import { createDeviationSchema, updateDeviationSchema } from './schema';

const include = { ...commonRelationsInclude, actionPlan: true };

async function notifyResponsible(record: any) {
  if (!record.responsibleId) return;
  await notifyUser({
    userId: record.responsibleId,
    type: 'NEW_ASSIGNMENT',
    title: 'Novo desvio atribuído',
    message: `Você foi definido como responsável pelo desvio: "${record.category}".`,
    link: `/desvios?open=${record.id}`,
  });
}

export default createCrudRouter({
  module: 'deviations',
  model: 'deviation',
  searchFields: ['category', 'description', 'location'],
  dateField: 'date',
  include,
  defaultSort: { field: 'date', dir: 'desc' },
  hasAttachments: true,
  createSchema: createDeviationSchema,
  updateSchema: updateDeviationSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'status', build: (v) => ({ status: v }) },
    { param: 'severity', build: (v) => ({ severity: v }) },
    { param: 'category', build: (v) => ({ category: v }) },
  ],
  afterCreate: async (record) => notifyResponsible(record),
  afterUpdate: async (record: any, previous: any, _req: Request) => {
    if (record.responsibleId && record.responsibleId !== previous.responsibleId) {
      await notifyResponsible(record);
    }
  },
});
