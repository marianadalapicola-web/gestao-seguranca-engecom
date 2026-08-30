import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import { ValidationError } from '../../utils/errors';
import { getByPath, REPORT_MODULES } from './config';
import { recordAudit } from '../../lib/audit';

const router = Router();
router.use(authenticate);

router.get(
  '/modules',
  authorize('reports', 'read'),
  asyncHandler(async (_req, res) => {
    res.json({ items: Object.entries(REPORT_MODULES).map(([key, cfg]) => ({ key, title: cfg.title })) });
  })
);

async function fetchReportData(moduleKey: string, query: Record<string, any>) {
  const config = REPORT_MODULES[moduleKey];
  if (!config) throw new ValidationError('Módulo de relatório inválido.');

  const where: Record<string, any> = {};
  if (config.dateField && (query.dateFrom || query.dateTo)) {
    where[config.dateField] = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
    };
  }
  if (query.siteId) where.siteId = query.siteId;
  if (query.sectorId) where.sectorId = query.sectorId;
  if (query.status) where.status = query.status;
  if (query.responsibleId) where.responsibleId = query.responsibleId;

  const delegate = (prisma as unknown as Record<string, any>)[config.model];
  const items = await delegate.findMany({
    where,
    include: config.include,
    orderBy: config.dateField ? { [config.dateField]: 'desc' } : { createdAt: 'desc' },
    take: 5000,
  });

  return { config, items };
}

router.get(
  '/:module/export',
  authorize('reports', 'read'),
  asyncHandler(async (req, res) => {
    const moduleKey = req.params.module;
    const format = String(req.query.format ?? 'xlsx');
    const { config, items } = await fetchReportData(moduleKey, req.query as Record<string, any>);

    await recordAudit({ userId: req.user!.id, action: 'EXPORT', module: 'reports', req, details: { moduleKey, format, count: items.length } });

    if (format === 'csv') {
      const header = config.columns.map((c) => `"${c.header}"`).join(';');
      const rows = items.map((item: any) =>
        config.columns
          .map((c) => {
            const raw = getByPath(item, c.path);
            const value = c.format ? c.format(raw) : raw ?? '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(';')
      );
      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${moduleKey}.csv"`);
      res.send(`﻿${csv}`);
      return;
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${moduleKey}.pdf"`);

      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      doc.pipe(res);

      doc.fontSize(16).fillColor('#0F2A4A').text('ENGECOM — Gestão de Segurança', { align: 'left' });
      doc.fontSize(12).fillColor('#333').text(config.title, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666').text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${items.length} registro(s)`);
      doc.moveDown(1);

      const colWidth = (doc.page.width - 60) / config.columns.length;
      let y = doc.y;

      doc.fontSize(9).fillColor('#0F2A4A');
      config.columns.forEach((col, i) => {
        doc.text(col.header, 30 + i * colWidth, y, { width: colWidth, ellipsis: true });
      });
      y += 16;
      doc.moveTo(30, y).lineTo(doc.page.width - 30, y).strokeColor('#ccc').stroke();
      y += 6;

      doc.fontSize(8).fillColor('#222');
      for (const item of items) {
        if (y > doc.page.height - 40) {
          doc.addPage();
          y = 30;
        }
        config.columns.forEach((col, i) => {
          const raw = getByPath(item, col.path);
          const value = col.format ? col.format(raw) : String(raw ?? '');
          doc.text(value, 30 + i * colWidth, y, { width: colWidth, ellipsis: true });
        });
        y += 14;
      }

      doc.end();
      return;
    }

    // default: xlsx
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ENGECOM — Gestão de Segurança';
    const sheet = workbook.addWorksheet(config.title.slice(0, 31));

    sheet.columns = config.columns.map((c) => ({ header: c.header, key: c.path, width: 22 }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A4A' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    items.forEach((item: any) => {
      const row: Record<string, unknown> = {};
      config.columns.forEach((c) => {
        const raw = getByPath(item, c.path);
        row[c.path] = c.format ? c.format(raw) : raw ?? '';
      });
      sheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleKey}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  })
);

export default router;
