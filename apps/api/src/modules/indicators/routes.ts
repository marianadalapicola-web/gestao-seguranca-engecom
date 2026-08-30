import { createCrudRouter } from '../../lib/crudFactory';
import { createIndicatorSchema, updateIndicatorSchema } from './schema';

const include = {
  site: { select: { id: true, name: true } },
  sector: { select: { id: true, name: true } },
  responsible: { select: { id: true, name: true, email: true, role: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
};

export default createCrudRouter({
  module: 'indicators',
  model: 'indicator',
  searchFields: ['name', 'status'],
  include,
  defaultSort: { field: 'period', dir: 'desc' },
  createSchema: createIndicatorSchema,
  updateSchema: updateIndicatorSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'period', build: (v) => ({ period: v }) },
  ],
});
