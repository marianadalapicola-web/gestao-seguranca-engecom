import { Request } from 'express';
import { prisma } from './prisma';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'ROLE_CHANGE'
  | 'EXPORT';

interface AuditInput {
  userId?: string | null;
  action: AuditAction;
  module: string;
  recordId?: string | null;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function recordAudit({ userId, action, module, recordId, details, req }: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        module,
        recordId: recordId ?? null,
        details: details ? (details as any) : undefined,
        ipAddress: req ? getClientIp(req) : null,
      },
    });
  } catch (err) {
    // Auditing must never break the primary operation, but a failure here
    // is a real problem worth surfacing in logs.
    console.error('Failed to write audit log:', err);
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}
