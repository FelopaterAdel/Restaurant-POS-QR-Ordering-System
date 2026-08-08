import type { NextFunction, RequestHandler, Response } from "express";
import type { UserRole } from "@restaurant/database";
import type { AuthenticatedRequest } from "../types/authenticated-request.js";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  const handler = function requireRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };

  return handler as RequestHandler;
}
