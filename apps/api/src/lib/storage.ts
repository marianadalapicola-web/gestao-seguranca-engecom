import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from './prisma';
import { env } from '../config/env';

// Two kinds of files, kept in separate "folders" (local subdirectories or S3
// key prefixes): attachments are permission-gated business records (evidence
// photos for DDS, inspections, deviations...), avatars are public profile
// photos. Both are addressed by an opaque key (a uuid + original extension)
// that's stored in the database — the storage driver only needs that key.
export type StorageKind = 'attachments' | 'avatars';

export const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadDir);

function localDir(kind: StorageKind): string {
  const dir = kind === 'avatars' ? path.join(UPLOAD_ROOT, 'avatars') : UPLOAD_ROOT;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = env.s3;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('STORAGE_DRIVER=s3 requires S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    }
    s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return s3Client;
}

function s3Bucket(): string {
  if (!env.s3.bucket) throw new Error('STORAGE_DRIVER=s3 requires S3_BUCKET.');
  return env.s3.bucket;
}

function s3Key(kind: StorageKind, fileKey: string): string {
  return kind === 'avatars' ? `avatars/${fileKey}` : `attachments/${fileKey}`;
}

export async function putFile(kind: StorageKind, fileKey: string, buffer: Buffer, mimeType: string): Promise<void> {
  if (env.storageDriver === 's3') {
    await getS3Client().send(
      new PutObjectCommand({ Bucket: s3Bucket(), Key: s3Key(kind, fileKey), Body: buffer, ContentType: mimeType })
    );
    return;
  }
  fs.writeFileSync(path.join(localDir(kind), fileKey), buffer);
}

export interface FileStream {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
}

export async function getFileStream(kind: StorageKind, fileKey: string): Promise<FileStream | null> {
  if (env.storageDriver === 's3') {
    try {
      const result = await getS3Client().send(new GetObjectCommand({ Bucket: s3Bucket(), Key: s3Key(kind, fileKey) }));
      if (!result.Body) return null;
      return {
        stream: result.Body as Readable,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
      };
    } catch (err) {
      if ((err as { name?: string }).name === 'NoSuchKey') return null;
      throw err;
    }
  }
  const filePath = path.join(localDir(kind), fileKey);
  if (!fs.existsSync(filePath)) return null;
  return {
    stream: fs.createReadStream(filePath),
    contentType: mimeTypeForExtension(path.extname(filePath)),
    contentLength: fs.statSync(filePath).size,
  };
}

const EXTENSION_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

function mimeTypeForExtension(ext: string): string | undefined {
  return EXTENSION_MIME_TYPES[ext.toLowerCase()];
}

export async function deleteFile(kind: StorageKind, fileKey: string): Promise<void> {
  if (env.storageDriver === 's3') {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: s3Bucket(), Key: s3Key(kind, fileKey) }));
    return;
  }
  await fs.promises.unlink(path.join(localDir(kind), fileKey)).catch(() => undefined);
}

/**
 * Deletes the physical files for every attachment of a given record.
 * Must run BEFORE the parent record is deleted: Prisma's onDelete: Cascade
 * removes the Attachment rows automatically, but never touches storage, so
 * calling this after the fact would have nothing left to look up.
 */
export async function deleteAttachmentFilesForRecord(module: string, recordId: string): Promise<void> {
  const attachments = await prisma.attachment.findMany({ where: { module, recordId } });
  for (const attachment of attachments) {
    await deleteFile('attachments', attachment.storedFileName);
  }
}
