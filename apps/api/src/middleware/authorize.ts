import { NextFunction, Request, Response } from 'express';
import { Action, Module, Role, hasPermission } from '../config/permissions';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Enforces the permissions matrix on the server. This is the real gate —
 * the frontend only mirrors it to avoid showing controls the user can't use.
 * Directly hitting the API without this check passing is never enough.
 */
export function authorize(module: Module, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!hasPermission(req.user.role, module, action)) {
      return next(new ForbiddenError(`Seu perfil não tem permissão para "${action}" em "${module}".`));
    }
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
