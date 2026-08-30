import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { createDdsSchema, updateDdsSchema } from './schema';

export default createCrudRouter({
  module: 'dds',
  model: 'dds',
  searchFields: ['theme', 'description'],
  dateField: 'date',
  include: commonRelationsInclude,
  defaultSort: { field: 'date', dir: 'desc' },
  createSchema: createDdsSchema,
  updateSchema: updateDdsSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'responsibleId', build: (v) => ({ responsibleId: v }) },
  ],
});
