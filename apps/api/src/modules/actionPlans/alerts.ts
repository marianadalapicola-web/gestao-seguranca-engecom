import { prisma } from '../../lib/prisma';
import { notifyUser } from '../../lib/notify';

const DUE_SOON_WINDOW_DAYS = 3;
const DEDUPE_WINDOW_HOURS = 24;

/**
 * Keeps ActionPlan.status in sync with real-world deadlines and generates
 * the "próximo do vencimento" / "vencido" notifications described in the
 * spec. Safe to call frequently — it only acts on state transitions and
 * de-duplicates notifications within a rolling window.
 */
export async function runActionPlanAlerts(): Promise<void> {
  const now = new Date();

  const overdue = await prisma.actionPlan.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: now } },
    select: { id: true, action: true, responsibleId: true, createdById: true },
  });

  if (overdue.length > 0) {
    await prisma.actionPlan.updateMany({
      where: { id: { in: overdue.map((p) => p.id) } },
      data: { status: 'OVERDUE' },
    });

    for (const plan of overdue) {
      const recipients = new Set([plan.responsibleId, plan.createdById].filter(Boolean) as string[]);
      for (const userId of recipients) {
        await notifyUser({
          userId,
          type: 'ACTION_PLAN_OVERDUE',
          title: 'Plano de ação vencido',
          message: `O plano de ação "${plan.action}" está vencido.`,
          link: `/planos-de-acao/${plan.id}`,
        });
      }
    }
  }

  const dueSoonLimit = new Date(now.getTime() + DUE_SOON_WINDOW_DAYS * 86_400_000);
  const dueSoon = await prisma.actionPlan.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      dueDate: { gte: now, lte: dueSoonLimit },
    },
    select: { id: true, action: true, responsibleId: true, createdById: true },
  });

  const dedupeSince = new Date(now.getTime() - DEDUPE_WINDOW_HOURS * 3_600_000);

  for (const plan of dueSoon) {
    const recipients = new Set([plan.responsibleId, plan.createdById].filter(Boolean) as string[]);
    for (const userId of recipients) {
      const link = `/planos-de-acao/${plan.id}`;
      const recent = await prisma.notification.findFirst({
        where: { userId, type: 'ACTION_PLAN_DUE_SOON', link, createdAt: { gte: dedupeSince } },
      });
      if (recent) continue;

      await notifyUser({
        userId,
        type: 'ACTION_PLAN_DUE_SOON',
        title: 'Plano de ação próximo do vencimento',
        message: `O plano de ação "${plan.action}" vence em breve.`,
        link,
      });
    }
  }
}
