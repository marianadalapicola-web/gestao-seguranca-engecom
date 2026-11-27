import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import { ValidationError } from '../../utils/errors';
import { getByPath, REPORT_MODULES, type ReportModuleConfig } from './config';
import { recordAudit } from '../../lib/audit';

const router = Router();
router.use(authenticate);

// Logo branco usado na sidebar (ver Sidebar.tsx) — em produção esse arquivo é
// servido a partir de web/dist (Vite copia public/ no build); em desenvolvimento
// ele só existe em web/public. Lido uma única vez e cacheado em memória.
const LOGO_CANDIDATES = [
  path.resolve(__dirname, '../../../../web/dist/logo-engecom.png'),
  path.resolve(__dirname, '../../../../web/public/logo-engecom.png'),
];
const LOGO_BUFFER: Buffer | null = (() => {
  const found = LOGO_CANDIDATES.find((p) => fs.existsSync(p));
  return found ? fs.readFileSync(found) : null;
})();
const LOGO_ASPECT_RATIO = 840 / 230;

const BRAND_900 = '#081c34';
const BRAND_700 = '#113a63';
const BRAND_50 = '#f1f7fd';
const SAFETY_500 = '#eeab1e';
const BORDER = '#e2e6ed';
const INK_900 = '#0f1a2b';
const INK_500 = '#647087';

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

function cellValues(config: ReportModuleConfig, item: unknown): string[] {
  return config.columns.map((c) => {
    const raw = getByPath(item, c.path);
    const value = c.format ? c.format(raw) : raw;
    return value === null || value === undefined ? '' : String(value);
  });
}

function buildPdf(res: import('express').Response, config: ReportModuleConfig, items: unknown[]) {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;
  const BANNER_HEIGHT = 68;
  const STRIPE_HEIGHT = 4;
  const FOOTER_ZONE = 34;
  const TABLE_TOP_PADDING = 18;
  const HEADER_ROW_HEIGHT = 22;
  const CELL_PADDING_X = 6;
  const CELL_PADDING_Y = 5;

  const totalWeight = config.columns.reduce((sum, c) => sum + (c.width ?? 1), 0);
  const colWidths = config.columns.map((c) => ((c.width ?? 1) / totalWeight) * contentWidth);
  const colOffsets: number[] = [];
  config.columns.reduce((x, _c, i) => {
    colOffsets[i] = x;
    return x + colWidths[i];
  }, marginX);

  let y = 0;

  function drawBanner() {
    doc.rect(0, 0, pageWidth, BANNER_HEIGHT).fill(BRAND_900);
    doc.rect(0, BANNER_HEIGHT, pageWidth, STRIPE_HEIGHT).fill(SAFETY_500);

    let textX = marginX;
    if (LOGO_BUFFER) {
      const logoHeight = 26;
      const logoWidth = logoHeight * LOGO_ASPECT_RATIO;
      doc.image(LOGO_BUFFER, marginX, (BANNER_HEIGHT - logoHeight) / 2, { height: logoHeight });
      textX = marginX + logoWidth + 18;
    }
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(config.title, textX, 16, { width: pageWidth - textX - marginX });
    doc
      .fillColor('#c7d8ee')
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${items.length} registro(s)`, textX, 38, {
        width: pageWidth - textX - marginX,
      });

    y = BANNER_HEIGHT + STRIPE_HEIGHT + TABLE_TOP_PADDING;
  }

  function drawTableHeader() {
    doc.rect(marginX, y, contentWidth, HEADER_ROW_HEIGHT).fill(BRAND_700);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    config.columns.forEach((col, i) => {
      doc.text(col.header, colOffsets[i] + CELL_PADDING_X, y + 6, { width: colWidths[i] - CELL_PADDING_X * 2 });
    });
    y += HEADER_ROW_HEIGHT;
  }

  function ensureSpace(rowHeight: number) {
    if (y + rowHeight > pageHeight - FOOTER_ZONE) {
      doc.addPage();
      drawBanner();
      drawTableHeader();
    }
  }

  drawBanner();
  drawTableHeader();

  if (items.length === 0) {
    doc.fillColor(INK_500).font('Helvetica-Oblique').fontSize(10).text('Nenhum registro encontrado para os filtros selecionados.', marginX, y + 10);
  }

  items.forEach((item, idx) => {
    const texts = cellValues(config, item);
    doc.font('Helvetica').fontSize(8.5);
    const cellHeights = texts.map((text, i) => doc.heightOfString(text, { width: colWidths[i] - CELL_PADDING_X * 2 }));
    const rowHeight = Math.max(16, ...cellHeights) + CELL_PADDING_Y * 2;

    ensureSpace(rowHeight);

    if (idx % 2 === 1) {
      doc.rect(marginX, y, contentWidth, rowHeight).fill(BRAND_50);
    }

    doc.fillColor(INK_900).font('Helvetica').fontSize(8.5);
    texts.forEach((text, i) => {
      doc.text(text, colOffsets[i] + CELL_PADDING_X, y + CELL_PADDING_Y, { width: colWidths[i] - CELL_PADDING_X * 2 });
    });

    doc
      .moveTo(marginX, y + rowHeight)
      .lineTo(marginX + contentWidth, y + rowHeight)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  });

  const pageRange = doc.bufferedPageRange();
  // doc.text() auto-paginates when it would draw inside the bottom margin,
  // which the footer intentionally does — disable that check for the
  // duration of the footer pass, restoring it after so it can't affect
  // anything drawn later.
  const originalBottomMargin = doc.page.margins.bottom;
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    const footerY = pageHeight - FOOTER_ZONE + 10;
    doc.moveTo(marginX, footerY - 8).lineTo(pageWidth - marginX, footerY - 8).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.fillColor(INK_500).font('Helvetica').fontSize(8);
    doc.text('ENGECOM — Gestão de Segurança', marginX, footerY, { width: contentWidth / 2, align: 'left', lineBreak: false });
    doc.text(`Página ${i - pageRange.start + 1} de ${pageRange.count}`, marginX, footerY, {
      width: contentWidth,
      align: 'right',
      lineBreak: false,
    });
  }
  doc.page.margins.bottom = originalBottomMargin;

  doc.end();
}

function buildXlsx(config: ReportModuleConfig, items: unknown[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ENGECOM — Gestão de Segurança';
  workbook.created = new Date();

  const colCount = config.columns.length;
  const HEADER_ROW = 4;

  const sheet = workbook.addWorksheet(config.title.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  sheet.mergeCells(1, 1, 1, colCount);
  sheet.getRow(1).height = 28;
  sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF081C34' } };
  if (LOGO_BUFFER) {
    const imageId = workbook.addImage({ buffer: LOGO_BUFFER as any, extension: 'png' });
    sheet.addImage(imageId, { tl: { col: 0.12, row: 0.12 }, ext: { width: 96, height: 26 } });
  } else {
    const brandCell = sheet.getCell(1, 1);
    brandCell.value = 'ENGECOM — Gestão de Segurança';
    brandCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    brandCell.alignment = { vertical: 'middle', indent: 1 };
  }

  sheet.mergeCells(2, 1, 2, colCount);
  const titleCell = sheet.getCell(2, 1);
  titleCell.value = config.title;
  titleCell.font = { bold: true, size: 12, color: { argb: 'FF113A63' } };
  titleCell.alignment = { vertical: 'middle', indent: 1 };
  sheet.getRow(2).height = 20;

  sheet.mergeCells(3, 1, 3, colCount);
  const metaCell = sheet.getCell(3, 1);
  metaCell.value = `Gerado em ${new Date().toLocaleString('pt-BR')} — ${items.length} registro(s)`;
  metaCell.font = { italic: true, size: 9, color: { argb: 'FF647087' } };
  metaCell.alignment = { vertical: 'middle', indent: 1 };
  sheet.getRow(3).height = 16;

  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.height = 20;
  config.columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113A63' } };
    cell.alignment = { vertical: 'middle', indent: 0 };
  });
  sheet.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: colCount } };

  if (items.length === 0) {
    sheet.mergeCells(HEADER_ROW + 1, 1, HEADER_ROW + 1, colCount);
    const emptyCell = sheet.getCell(HEADER_ROW + 1, 1);
    emptyCell.value = 'Nenhum registro encontrado para os filtros selecionados.';
    emptyCell.font = { italic: true, color: { argb: 'FF647087' } };
  }

  items.forEach((item, idx) => {
    const rowIndex = HEADER_ROW + 1 + idx;
    const row = sheet.getRow(rowIndex);
    const texts = cellValues(config, item);
    texts.forEach((value, i) => {
      const cell = row.getCell(i + 1);
      cell.value = value;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E6ED' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E6ED' } },
      };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F7FD' } };
      }
    });
  });

  config.columns.forEach((c, i) => {
    const maxContentLen = items.reduce((max: number, item) => {
      const value = cellValues(config, item)[i];
      return Math.max(max, value.length);
    }, 0);
    sheet.getColumn(i + 1).width = Math.min(45, Math.max(12, Math.max(c.header.length, maxContentLen) + 3));
  });

  return workbook;
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
        cellValues(config, item)
          .map((value) => `"${value.replace(/"/g, '""')}"`)
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
      buildPdf(res, config, items);
      return;
    }

    // default: xlsx
    const workbook = buildXlsx(config, items);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleKey}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  })
);

export default router;
