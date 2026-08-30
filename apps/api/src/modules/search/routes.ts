import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { hasPermission, Module } from '../../config/permissions';

const router = Router();
router.use(authenticate);

interface SearchSource {
  module: Module;
  label: string;
  run: (term: string) => Promise<Array<{ id: string; title: string; subtitle?: string; link: string }>>;
}

const SOURCES: SearchSource[] = [
  {
    module: 'rituals',
    label: 'Rituais',
    run: async (term) => {
      const items = await prisma.ritual.findMany({
        where: { OR: [{ theme: { contains: term, mode: 'insensitive' } }, { type: { contains: term, mode: 'insensitive' } }] },
        take: 5,
      });
      return items.map((i) => ({ id: i.id, title: i.theme ?? i.type, subtitle: new Date(i.date).toLocaleDateString('pt-BR'), link: `/rituais/${i.id}` }));
    },
  },
  {
    module: 'dds',
    label: 'DDS',
    run: async (term) => {
      const items = await prisma.dds.findMany({ where: { theme: { contains: term, mode: 'insensitive' } }, take: 5 });
      return items.map((i) => ({ id: i.id, title: i.theme, subtitle: new Date(i.date).toLocaleDateString('pt-BR'), link: `/dds/${i.id}` }));
    },
  },
  {
    module: 'inspections',
    label: 'Inspeções',
    run: async (term) => {
      const items = await prisma.inspection.findMany({ where: { type: { contains: term, mode: 'insensitive' } }, take: 5 });
      return items.map((i) => ({ id: i.id, title: i.type, subtitle: new Date(i.date).toLocaleDateString('pt-BR'), link: `/inspecoes/${i.id}` }));
    },
  },
  {
    module: 'deviations',
    label: 'Desvios',
    run: async (term) => {
      const items = await prisma.deviation.findMany({
        where: { OR: [{ category: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }] },
        take: 5,
      });
      return items.map((i) => ({ id: i.id, title: i.category, subtitle: i.description.slice(0, 60), link: `/desvios/${i.id}` }));
    },
  },
  {
    module: 'incidents',
    label: 'Incidentes',
    run: async (term) => {
      const items = await prisma.incident.findMany({ where: { type: { contains: term, mode: 'insensitive' } }, take: 5 });
      return items.map((i) => ({ id: i.id, title: i.type, subtitle: new Date(i.date).toLocaleDateString('pt-BR'), link: `/incidentes/${i.id}` }));
    },
  },
  {
    module: 'actionPlans',
    label: 'Planos de Ação',
    run: async (term) => {
      const items = await prisma.actionPlan.findMany({ where: { action: { contains: term, mode: 'insensitive' } }, take: 5 });
      return items.map((i) => ({ id: i.id, title: i.action, subtitle: i.status, link: `/planos-de-acao/${i.id}` }));
    },
  },
  {
    module: 'users',
    label: 'Pessoas',
    run: async (term) => {
      const items = await prisma.user.findMany({
        where: { OR: [{ name: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }] },
        take: 5,
      });
      return items.map((i) => ({ id: i.id, title: i.name, subtitle: i.email, link: `/usuarios/${i.id}` }));
    },
  },
];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const term = String(req.query.q ?? '').trim();
    if (term.length < 2) {
      res.json({ groups: [] });
      return;
    }

    const allowedSources = SOURCES.filter((s) => hasPermission(req.user!.role, s.module, 'read'));
    const results = await Promise.all(
      allowedSources.map(async (source) => ({ module: source.module, label: source.label, items: await source.run(term) }))
    );

    res.json({ groups: results.filter((g) => g.items.length > 0) });
  })
);

export default router;
