import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { createRefusalRightSchema, updateRefusalRightSchema } from './schema';

export default createCrudRouter({
  module: 'refusalRights',
  model: 'refusalRight',
  searchFields: ['workerName', 'reason', 'location', 'activity'],
  dateField: 'date',
  include: commonRelationsInclude,
  defaultSort: { field: 'date', dir: 'desc' },
  hasAttachments: true,
  createSchema: createRefusalRightSchema,
  updateSchema: updateRefusalRightSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'status', build: (v) => ({ status: v }) },
  ],
});
