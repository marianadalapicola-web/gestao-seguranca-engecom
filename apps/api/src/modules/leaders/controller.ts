import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { asyncHandler } from '../../utils/asyncHandler';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { hashPassword } from '../../utils/password';

function serializeLeader(user: {
  id: string;
  name: string;
  email: string | null;
  hasSystemAccess: boolean;
  position: string | null;
  status: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  sectorsLed?: { id: string; name: string }[];
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    hasSystemAccess: user.hasSystemAccess,
    position: user.position,
    status: user.status,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    sectorsLed: user.sectorsLed ?? [],
  };
}

export const listLeaders = asyncHandler(async (req: Request, res: Response) => {
  const { search, sectorId, status } = req.query as { search?: string; sectorId?: string; status?: 'ACTIVE' | 'BLOCKED' };

  const where: Prisma.UserWhereInput = {
    role: 'LEADERSHIP',
    ...(status ? { status } : {}),
    ...(sectorId ? { sectorsLed: { some: { id: sectorId } } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const leaders = await prisma.user.findMany({
    where,
    include: { sectorsLed: { where: { active: true }, select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });

  res.json({ items: leaders.map(serializeLeader) });
});

export const getLeader = asyncHandler(async (req: Request, res: Response) => {
  const leader = await prisma.user.findFirst({
    where: { id: req.params.id, role: 'LEADERSHIP' },
    include: { sectorsLed: { where: { active: true }, select: { id: true, name: true } } },
  });
  if (!leader) throw new NotFoundError('Líder não encontrado.');
  res.json({ leader: serializeLeader(leader) });
});

export const createLeader = asyncHandler(async (req: Request, res: Response) => {
  const { name, position, hasSystemAccess, email, password } = req.body;

  if (hasSystemAccess) {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new ConflictError('Já existe um usuário cadastrado com este e-mail.');
  }

  const leader = await prisma.user.create({
    data: {
      name,
      position,
      role: 'LEADERSHIP',
      hasSystemAccess: Boolean(hasSystemAccess),
      email: hasSystemAccess ? email.toLowerCase() : null,
      passwordHash: hasSystemAccess ? await hashPassword(password) : null,
    },
    include: { sectorsLed: { select: { id: true, name: true } } },
  });

  await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'leaders', recordId: leader.id, req });

  res.status(201).json({ leader: serializeLeader(leader) });
});

export const updateLeader = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, position, status, hasSystemAccess, email, password } = req.body;

  const target = await prisma.user.findFirst({ where: { id, role: 'LEADERSHIP' } });
  if (!target) throw new NotFoundError('Líder não encontrado.');

  const data: Prisma.UserUpdateInput = {
    ...(name !== undefined ? { name } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(status !== undefined ? { status } : {}),
  };

  if (hasSystemAccess === false) {
    data.hasSystemAccess = false;
    data.email = null;
    data.passwordHash = null;
  } else if (hasSystemAccess === true || (target.hasSystemAccess && (email !== undefined || password !== undefined))) {
    const grantingNow = !target.hasSystemAccess;
    if (grantingNow && !password) {
      throw new ValidationError('Informe uma senha para liberar o acesso ao sistema.');
    }
    if (email !== undefined && email.toLowerCase() !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) throw new ConflictError('Já existe um usuário cadastrado com este e-mail.');
      data.email = email.toLowerCase();
    }
    if (password) data.passwordHash = await hashPassword(password);
    data.hasSystemAccess = true;
  }

  const leader = await prisma.user.update({
    where: { id },
    data,
    include: { sectorsLed: { where: { active: true }, select: { id: true, name: true } } },
  });

  await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: 'leaders', recordId: id, req });

  res.json({ leader: serializeLeader(leader) });
});

export const deleteLeader = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    throw new ForbiddenError('Você não pode excluir seu próprio usuário.');
  }

  const target = await prisma.user.findFirst({ where: { id, role: 'LEADERSHIP' } });
  if (!target) throw new NotFoundError('Líder não encontrado.');

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new ConflictError(
        'Este líder possui registros vinculados (DDS, inspeções, desvios etc.) e não pode ser excluído. Bloqueie o cadastro em vez de excluí-lo.'
      );
    }
    throw err;
  }

  await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'leaders', recordId: id, req });

  res.status(204).send();
});

export const listEvaluations = asyncHandler(async (req: Request, res: Response) => {
  const leader = await prisma.user.findFirst({ where: { id: req.params.id, role: 'LEADERSHIP' } });
  if (!leader) throw new NotFoundError('Líder não encontrado.');

  const evaluations = await prisma.leaderEvaluation.findMany({
    where: { leaderId: req.params.id },
    include: { evaluator: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });

  res.json({ items: evaluations });
});

export const createEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const leader = await prisma.user.findFirst({ where: { id: req.params.id, role: 'LEADERSHIP' } });
  if (!leader) throw new NotFoundError('Líder não encontrado.');

  const { date, leadershipScore, communicationScore, safetyCommitmentScore, notes } = req.body;

  const evaluation = await prisma.leaderEvaluation.create({
    data: {
      leaderId: leader.id,
      evaluatorId: req.user!.id,
      date: date ? new Date(date) : new Date(),
      leadershipScore,
      communicationScore,
      safetyCommitmentScore,
      notes,
    },
    include: { evaluator: { select: { id: true, name: true } } },
  });

  await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'leaderEvaluations', recordId: evaluation.id, req });

  res.status(201).json({ evaluation });
});
