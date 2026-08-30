import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../utils/tokens';
import { Role } from '../config/permissions';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  status: 'ACTIVE' | 'BLOCKED';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = bearer ?? req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError('Sessão não encontrada. Faça login novamente.');
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado.');
    }
    if (user.status === 'BLOCKED') {
      throw new UnauthorizedError('Usuário bloqueado. Contate o administrador.');
    }

    req.user = {
      id: user.id,
      role: user.role as Role,
      name: user.name,
      email: user.email,
      status: user.status,
    };
    next();
  } catch (err) {
    next(new UnauthorizedError('Sessão inválida ou expirada.'));
  }
}
