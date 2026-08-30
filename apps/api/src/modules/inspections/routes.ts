import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { createInspectionSchema, updateInspectionSchema } from './schema';

export default createCrudRouter({
  module: 'inspections',
  model: 'inspection',
  searchFields: ['type', 'result', 'notes'],
  dateField: 'date',
  include: commonRelationsInclude,
  defaultSort: { field: 'date', dir: 'desc' },
  createSchema: createInspectionSchema,
  updateSchema: updateInspectionSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'responsibleId', build: (v) => ({ responsibleId: v }) },
    { param: 'status', build: (v) => ({ status: v }) },
    { param: 'type', build: (v) => ({ type: v }) },
  ],
});
