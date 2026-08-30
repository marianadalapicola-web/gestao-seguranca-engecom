import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../utils/password';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  parseDurationToMs,
  signAccessToken,
} from '../../utils/tokens';
import { env } from '../../config/env';
import { UnauthorizedError, ValidationError } from '../../utils/errors';
import { Role } from '../../config/permissions';

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new UnauthorizedError('E-mail ou senha inválidos.');
  if (user.status === 'BLOCKED') throw new UnauthorizedError('Usuário bloqueado. Contate o administrador.');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('E-mail ou senha inválidos.');

  return user;
}

export async function issueSession(userId: string, role: Role) {
  const accessToken = signAccessToken({ sub: userId, role });

  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = hashOpaqueToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.jwtRefreshExpiresIn));

  await prisma.refreshToken.create({
    data: { userId, tokenHash: refreshTokenHash, expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError('Sessão expirada. Faça login novamente.');
  }
  if (record.user.status === 'BLOCKED') {
    throw new UnauthorizedError('Usuário bloqueado. Contate o administrador.');
  }

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const session = await issueSession(record.userId, record.user.role as Role);
  return { ...session, user: record.user };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Do not reveal whether the e-mail exists — respond the same way either way.
  if (!user || user.status === 'BLOCKED') return null;

  const rawToken = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  return { rawToken, user };
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
  const tokenHash = hashOpaqueToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ValidationError('Link de redefinição inválido ou expirado.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return record.userId;
}
