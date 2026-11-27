import { createCrudRouter } from '../../lib/crudFactory';
import { commonRelationsInclude } from '../../utils/zodHelpers';
import { createIncidentSchema, updateIncidentSchema } from './schema';

const { responsible, ...include } = commonRelationsInclude;

export default createCrudRouter({
  module: 'incidents',
  model: 'incident',
  searchFields: ['type', 'description', 'location', 'cause'],
  dateField: 'date',
  include,
  defaultSort: { field: 'date', dir: 'desc' },
  hasAttachments: true,
  createSchema: createIncidentSchema,
  updateSchema: updateIncidentSchema,
  filters: [
    { param: 'sectorId', build: (v) => ({ sectorId: v }) },
    { param: 'siteId', build: (v) => ({ siteId: v }) },
    { param: 'status', build: (v) => ({ status: v }) },
    { param: 'type', build: (v) => ({ type: v }) },
  ],
});
