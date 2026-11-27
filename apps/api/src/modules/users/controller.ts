import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { asyncHandler } from '../../utils/asyncHandler';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { hashPassword } from '../../utils/password';
import { getPermissionsForRole, ROLE_LABELS, Role } from '../../config/permissions';

function serialize(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role as Role],
    status: user.status,
    position: user.position,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, role, status, page = 1, pageSize = 20, sortBy = 'createdAt', sortDir = 'desc' } = req.query as any;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    items: items.map(serialize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('Usuário não encontrado.');
  res.json({ user: serialize(user), permissions: getPermissionsForRole(user.role as Role) });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, position } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ConflictError('Já existe um usuário cadastrado com este e-mail.');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role, position },
  });

  await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'users', recordId: user.id, req, details: { role } });

  res.status(201).json({ user: serialize(user) });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, status, position } = req.body;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError('Usuário não encontrado.');

  if (id === req.user!.id && role && role !== target.role) {
    throw new ForbiddenError('Você não pode alterar seu próprio nível de acesso.');
  }
  if (id === req.user!.id && status && status !== target.status) {
    throw new ForbiddenError('Você não pode alterar seu próprio status de acesso.');
  }

  if (email && email.toLowerCase() !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new ConflictError('Já existe um usuário cadastrado com este e-mail.');
  }

  if (target.role === 'ADMIN' && role && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    if (adminCount <= 1) {
      throw new ValidationError('Não é possível remover o último administrador ativo do sistema.');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email: email.toLowerCase() } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(position !== undefined ? { position } : {}),
    },
  });

  if (role && role !== target.role) {
    await recordAudit({ userId: req.user!.id, action: 'ROLE_CHANGE', module: 'users', recordId: id, req, details: { from: target.role, to: role } });
  }
  if (status && status !== target.status) {
    await recordAudit({ userId: req.user!.id, action: 'STATUS_CHANGE', module: 'users', recordId: id, req, details: { from: target.status, to: status } });
    if (status === 'BLOCKED') {
      await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
  }
  await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'users', recordId: id, req });

  res.json({ user: serialize(user) });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    throw new ForbiddenError('Você não pode excluir seu próprio usuário.');
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError('Usuário não encontrado.');

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) throw new ValidationError('Não é possível excluir o último administrador do sistema.');
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new ConflictError(
        'Este usuário possui registros vinculados (rituais, DDS, inspeções etc.) e não pode ser excluído. Bloqueie o usuário em vez de excluí-lo.'
      );
    }
    throw err;
  }
  await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'users', recordId: id, req, details: { email: target.email } });

  res.status(204).send();
});
