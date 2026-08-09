import type { NextFunction, RequestHandler, Response } from "express";
import type { UserRole } from "@restaurant/database";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";
import type { AuthenticatedRequest } from "../types/authenticated-request.js";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  const handler = function requireRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };

  return handler as RequestHandler;
}
