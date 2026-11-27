import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../lib/prisma';
import { createUser, deleteUser, getUser, listUsers, updateUser } from './controller';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './schema';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

// Diretório mínimo de pessoas (id/nome/perfil) para popular seletores de
// "responsável" nos módulos operacionais. Disponível a qualquer usuário
// autenticado — atribuir responsabilidade por uma atividade não é a mesma
// permissão que administrar contas de usuário (essa continua exclusiva do
// Administrador nas rotas abaixo).
router.get(
  '/directory',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ items: users });
  })
);

// Gestão de Usuários é exclusiva do Administrador — reforçado aqui no
// backend, não apenas escondendo o menu no frontend.
router.get('/', authorize('users', 'read'), validate({ query: listUsersQuerySchema }), listUsers);
router.get('/:id', authorize('users', 'read'), validate({ params: idParamSchema }), getUser);
router.post('/', authorize('users', 'create'), validate({ body: createUserSchema }), createUser);
router.patch('/:id', authorize('users', 'update'), validate({ params: idParamSchema, body: updateUserSchema }), updateUser);
router.delete('/:id', authorize('users', 'delete'), validate({ params: idParamSchema }), deleteUser);

export default router;
