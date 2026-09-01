import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { env } from '../config/env';

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

// Fotos de perfil ficam à parte dos anexos de registros (rituais, DDS...) —
// são públicas por natureza (servidas como arquivo estático) e não seguem o
// controle de permissão por módulo que os anexos têm.
export const AVATAR_UPLOAD_ROOT = path.join(UPLOAD_ROOT, 'avatars');
if (!fs.existsSync(AVATAR_UPLOAD_ROOT)) fs.mkdirSync(AVATAR_UPLOAD_ROOT, { recursive: true });

/**
 * Deletes the physical files for every attachment of a given record.
 * Must run BEFORE the parent record is deleted: Prisma's onDelete: Cascade
 * removes the Attachment rows automatically, but never touches disk, so
 * calling this after the fact would have nothing left to look up.
 */
export async function deleteAttachmentFilesForRecord(module: string, recordId: string): Promise<void> {
  const attachments = await prisma.attachment.findMany({ where: { module, recordId } });
  for (const attachment of attachments) {
    const filePath = path.join(UPLOAD_ROOT, attachment.storedFileName);
    fs.unlink(filePath, () => undefined);
  }
}
