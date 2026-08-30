import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { createRitualSchema, updateRitualSchema } from './schema';

export default createCrudRouter({
  module: 'rituals',
  model: 'ritual',
  searchFields: ['theme', 'type', 'location', 'notes'],
  dateField: 'date',
  include: commonRelationsInclude,
  defaultSort: { field: 'date', dir: 'desc' },
  createSchema: createRitualSchema,
  updateSchema: updateRitualSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'responsibleId', build: (v) => ({ responsibleId: v }) },
    { param: 'status', build: (v) => ({ status: v }) },
    { param: 'type', build: (v) => ({ type: v }) },
  ],
});
