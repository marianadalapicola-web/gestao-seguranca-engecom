import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { recordAudit } from '../../lib/audit';
import { env } from '../../config/env';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { Module, hasPermission } from '../../config/permissions';

const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const MODULE_TO_FK: Record<string, { field: string; delegate: string }> = {
  rituals: { field: 'ritualId', delegate: 'ritual' },
  dds: { field: 'ddsId', delegate: 'dds' },
  inspections: { field: 'inspectionId', delegate: 'inspection' },
  deviations: { field: 'deviationId', delegate: 'deviation' },
  incidents: { field: 'incidentId', delegate: 'incident' },
  refusalRights: { field: 'refusalRightId', delegate: 'refusalRight' },
  managerialInspections: { field: 'managerialInspectionId', delegate: 'managerialInspection' },
  actionPlans: { field: 'actionPlanId', delegate: 'actionPlan' },
};

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new ValidationError('Tipo de arquivo não permitido.'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();
router.use(authenticate);

const uploadBodySchema = z.object({
  module: z.enum(Object.keys(MODULE_TO_FK) as [string, ...string[]]),
  recordId: z.string().uuid(),
});

router.post(
  '/',
  upload.single('file'),
  validate({ body: uploadBodySchema }),
  asyncHandler(async (req, res) => {
    const { module, recordId } = req.body as { module: keyof typeof MODULE_TO_FK; recordId: string };
    if (!req.file) throw new ValidationError('Nenhum arquivo enviado.');

    if (!hasPermission(req.user!.role, module as Module, 'update')) {
      fs.unlink(req.file.path, () => undefined);
      throw new ForbiddenError('Seu perfil não pode anexar evidências neste módulo.');
    }

    const mapping = MODULE_TO_FK[module];
    const delegate = (prisma as unknown as Record<string, any>)[mapping.delegate];
    const parent = await delegate.findUnique({ where: { id: recordId } });
    if (!parent) {
      fs.unlink(req.file.path, () => undefined);
      throw new NotFoundError('Registro relacionado não encontrado.');
    }

    const attachment = await prisma.attachment.create({
      data: {
        module,
        recordId,
        fileName: req.file.originalname,
        storedFileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user!.id,
        [mapping.field]: recordId,
      },
    });

    await recordAudit({ userId: req.user!.id, action: 'CREATE', module: 'attachments', recordId: attachment.id, req, details: { module, recordId } });

    res.status(201).json({ attachment });
  })
);

router.get(
  '/record/:module/:recordId',
  asyncHandler(async (req, res) => {
    const { module, recordId } = req.params as { module: string; recordId: string };
    if (!MODULE_TO_FK[module]) throw new ValidationError('Módulo inválido.');

    if (!hasPermission(req.user!.role, module as Module, 'read')) throw new ForbiddenError();

    const attachments = await prisma.attachment.findMany({ where: { module, recordId }, orderBy: { createdAt: 'desc' } });
    res.json({ items: attachments });
  })
);

router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) throw new NotFoundError();

    if (!hasPermission(req.user!.role, attachment.module as Module, 'read')) throw new ForbiddenError();

    const filePath = path.join(UPLOAD_ROOT, attachment.storedFileName);
    if (!fs.existsSync(filePath)) throw new NotFoundError('Arquivo não encontrado no armazenamento.');

    res.download(filePath, attachment.fileName);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) throw new NotFoundError();

    if (!hasPermission(req.user!.role, attachment.module as Module, 'update')) throw new ForbiddenError();

    await prisma.attachment.delete({ where: { id: attachment.id } });
    const filePath = path.join(UPLOAD_ROOT, attachment.storedFileName);
    fs.unlink(filePath, () => undefined);

    await recordAudit({ userId: req.user!.id, action: 'DELETE', module: 'attachments', recordId: attachment.id, req });
    res.status(204).send();
  })
);

export default router;
