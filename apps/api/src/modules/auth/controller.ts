import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { recordAudit } from '../../lib/audit';
import { asyncHandler } from '../../utils/asyncHandler';
import { UnauthorizedError, ValidationError } from '../../utils/errors';
import { getPermissionsForRole, ROLE_LABELS, Role } from '../../config/permissions';
import { comparePassword, hashPassword, isStrongPassword } from '../../utils/password';
import { setAuthCookies, clearAuthCookies } from './cookies';
import {
  authenticateUser,
  createPasswordResetToken,
  issueSession,
  resetPasswordWithToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from './service';

function serializeUser(user: {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  position: string | null;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
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
    permissions: getPermissionsForRole(user.role as Role),
  };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authenticateUser(email, password);

  const { accessToken, refreshToken } = await issueSession(user.id, user.role as Role);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  setAuthCookies(res, accessToken, refreshToken);

  await recordAudit({ userId: user.id, action: 'LOGIN', module: 'auth', req });

  res.json({ user: serializeUser({ ...user, lastLoginAt: new Date() }), accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new UnauthorizedError('Sessão não encontrada.');

  const { accessToken, refreshToken, user } = await rotateRefreshToken(token);
  setAuthCookies(res, accessToken, refreshToken);

  res.json({ user: serializeUser(user), accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) await revokeRefreshToken(token);
  clearAuthCookies(res);

  if (req.user) {
    await recordAudit({ userId: req.user.id, action: 'LOGOUT', module: 'auth', req });
  }

  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: serializeUser(user) });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await createPasswordResetToken(email);

  await recordAudit({
    userId: result?.user.id,
    action: 'PASSWORD_RESET_REQUEST',
    module: 'auth',
    req,
  });

  // No e-mail provider is configured for this environment. The reset link
  // is returned/logged instead of being silently "sent" — this is called
  // out explicitly rather than faking delivery.
  if (result) {
    const resetLink = `${req.headers.origin ?? ''}/redefinir-senha?token=${result.rawToken}`;
    console.info(`[password-reset] Link para ${result.user.email}: ${resetLink}`);
    res.json({
      message: 'Se o e-mail existir em nossa base, um link de redefinição foi gerado.',
      devResetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined,
    });
    return;
  }

  res.json({ message: 'Se o e-mail existir em nossa base, um link de redefinição foi gerado.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const userId = await resetPasswordWithToken(token, password);
  await recordAudit({ userId, action: 'PASSWORD_CHANGE', module: 'auth', req });
  res.json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });

  // A senha só pode ser trocada por quem já está autenticado, o que exige
  // ter feito login com senha — logo passwordHash aqui nunca é nulo.
  const valid = await comparePassword(currentPassword, user.passwordHash!);
  if (!valid) throw new ValidationError('Senha atual incorreta.');
  if (!isStrongPassword(newPassword)) {
    throw new ValidationError('A nova senha deve ter ao menos 8 caracteres, com letras e números.');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await recordAudit({ userId: user.id, action: 'PASSWORD_CHANGE', module: 'auth', req });

  res.json({ message: 'Senha alterada com sucesso.' });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string | null };

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });

  await recordAudit({ userId: user.id, action: 'UPDATE', module: 'profile', recordId: user.id, req });

  res.json({ user: serializeUser(user) });
});
