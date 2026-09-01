import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function notifyUser({ userId, type, title, message, link }: NotifyInput) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyUsers(userIds: string[], input: Omit<NotifyInput, 'userId'>) {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, ...input })),
  });
}

export async function notifyRoles(roles: string[], input: Omit<NotifyInput, 'userId'>) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles as any }, status: 'ACTIVE' },
    select: { id: true },
  });
  await notifyUsers(users.map((u) => u.id), input);
}
