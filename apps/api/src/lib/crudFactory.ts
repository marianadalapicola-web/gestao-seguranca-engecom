import { Request, Router } from 'express';
import { z, ZodTypeAny } from 'zod';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAudit } from './audit';
import { NotFoundError } from '../utils/errors';
import { Module } from '../config/permissions';
import { prisma } from './prisma';

interface FilterDef {
  param: string;
  build: (value: string) => Record<string, unknown>;
}

export interface CrudConfig {
  module: Module;
  /** Lower-camel-case Prisma model delegate name, e.g. "ritual", "actionPlan". */
  model: string;
  searchFields?: string[];
  dateField?: string;
  filters?: FilterDef[];
  include?: Record<string, unknown>;
  defaultSort?: { field: string; dir: 'asc' | 'desc' };
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  beforeCreate?: (data: Record<string, unknown>, req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (data: Record<string, unknown>, previous: any, req: Request) => Promise<Record<string, unknown>> | Record<string, unknown>;
  afterCreate?: (record: any, req: Request) => Promise<void> | void;
  afterUpdate?: (record: any, previous: any, req: Request) => Promise<void> | void;
  afterDelete?: (previous: any, req: Request) => Promise<void> | void;
  serialize?: (record: any) => unknown;
}

const listQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(200).optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .passthrough();

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * Generic CRUD router shared across the operational modules (rituals, DDS,
 * inspections, deviations, incidents, refusal rights, action plans...).
 * Every instance still targets its own real Prisma model/table — this only
 * avoids re-implementing pagination/filter/sort/audit/permission wiring
 * eight times over. Module-specific rules are injected via hooks
 * (beforeCreate/afterCreate/afterUpdate/afterDelete).
 */
export function createCrudRouter(config: CrudConfig): Router {
  const router = Router();
  router.use(authenticate);

  const delegate = (prisma as unknown as Record<string, any>)[config.model];
  if (!delegate) {
    throw new Error(`Unknown Prisma model delegate: ${config.model}`);
  }

  router.get(
    '/',
    authorize(config.module, 'read'),
    validate({ query: listQuerySchema }),
    asyncHandler(async (req, res) => {
      const { search, page = 1, pageSize = 20, sortBy, sortDir, dateFrom, dateTo, ...rest } = req.query as any;

      const where: Record<string, any> = {};

      if (search && config.searchFields?.length) {
        where.OR = config.searchFields.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }

      if (config.dateField && (dateFrom || dateTo)) {
        where[config.dateField] = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
        };
      }

      for (const filter of config.filters ?? []) {
        const value = rest[filter.param];
        if (value !== undefined && value !== '') {
          Object.assign(where, filter.build(String(value)));
        }
      }

      const sortField = sortBy ?? config.defaultSort?.field ?? 'createdAt';
      const sortDirection = sortDir ?? config.defaultSort?.dir ?? 'desc';

      const [items, total] = await Promise.all([
        delegate.findMany({
          where,
          include: config.include,
          orderBy: { [sortField]: sortDirection },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        delegate.count({ where }),
      ]);

      res.json({
        items: config.serialize ? items.map(config.serialize) : items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    })
  );

  router.get(
    '/:id',
    authorize(config.module, 'read'),
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const record = await delegate.findUnique({
        where: { id: req.params.id },
        include: { ...config.include, attachments: true },
      });
      if (!record) throw new NotFoundError();
      res.json({ item: config.serialize ? config.serialize(record) : record });
    })
  );

  router.post(
    '/',
    authorize(config.module, 'create'),
    validate({ body: config.createSchema }),
    asyncHandler(async (req, res) => {
      let data: Record<string, unknown> = { ...req.body, createdById: req.user!.id };
      if (config.beforeCreate) data = await config.beforeCreate(data, req);

      const record = await delegate.create({ data, include: config.include });
      await recordAudit({ userId: req.user!.id, action: 'CREATE', module: config.module, recordId: record.id, req });
      if (config.afterCreate) await config.afterCreate(record, req);

      res.status(201).json({ item: config.serialize ? config.serialize(record) : record });
    })
  );

  router.patch(
    '/:id',
    authorize(config.module, 'update'),
    validate({ params: idParamSchema, body: config.updateSchema }),
    asyncHandler(async (req, res) => {
      const previous = await delegate.findUnique({ where: { id: req.params.id } });
      if (!previous) throw new NotFoundError();

      let data = req.body;
      if (config.beforeUpdate) data = await config.beforeUpdate(data, previous, req);

      const record = await delegate.update({ where: { id: req.params.id }, data, include: config.include });
      await recordAudit({ userId: req.user!.id, action: 'UPDATE', module: config.module, recordId: record.id, req });
      if (config.afterUpdate) await config.afterUpdate(record, previous, req);

      res.json({ item: config.serialize ? config.serialize(record) : record });
    })
  );

  router.delete(
    '/:id',
    authorize(config.module, 'delete'),
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const previous = await delegate.findUnique({ where: { id: req.params.id } });
      if (!previous) throw new NotFoundError();

      await delegate.delete({ where: { id: req.params.id } });
      await recordAudit({ userId: req.user!.id, action: 'DELETE', module: config.module, recordId: req.params.id, req });
      if (config.afterDelete) await config.afterDelete(previous, req);

      res.status(204).send();
    })
  );

  return router;
}
