import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  deleteIdsRecord,
  getIdsConfig,
  getIdsSummary,
  listIdsRecords,
  updateIdsConfig,
  upsertIdsRecord,
} from './controller';
import { idsConfigSchema, idsRecordSchema } from './schema';

const router = Router();
router.use(authenticate);

router.get('/config', authorize('ids', 'read'), getIdsConfig);
// A fórmula/pesos do IDS são configuração estrutural do sistema — apenas o
// Administrador pode alterá-la (a Engenheira tem "config" somente leitura).
router.patch('/config', authorize('config', 'update'), validate({ body: idsConfigSchema }), updateIdsConfig);

router.get('/summary', authorize('ids', 'read'), getIdsSummary);
router.get('/records', authorize('ids', 'read'), listIdsRecords);
router.put('/records', authorize('ids', 'update'), validate({ body: idsRecordSchema }), upsertIdsRecord);
router.delete('/records/:id', authorize('ids', 'delete'), deleteIdsRecord);

export default router;
