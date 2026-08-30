import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createUser, deleteUser, getUser, listUsers, updateUser } from './controller';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './schema';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

// Gestão de Usuários é exclusiva do Administrador — reforçado aqui no
// backend, não apenas escondendo o menu no frontend.
router.get('/', authorize('users', 'read'), validate({ query: listUsersQuerySchema }), listUsers);
router.get('/:id', authorize('users', 'read'), validate({ params: idParamSchema }), getUser);
router.post('/', authorize('users', 'create'), validate({ body: createUserSchema }), createUser);
router.patch('/:id', authorize('users', 'update'), validate({ params: idParamSchema, body: updateUserSchema }), updateUser);
router.delete('/:id', authorize('users', 'delete'), validate({ params: idParamSchema }), deleteUser);

export default router;
