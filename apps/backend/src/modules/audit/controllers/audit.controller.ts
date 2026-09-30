import type { NextFunction, Response } from "express";
import { sendPaginated } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import type { AuditLogQueryDTO } from "../schemas/audit-log-query.schema.js";
import { ListAuditLogUseCase } from "../use-cases/list-audit-log.use-case.js";

const listAuditLogUseCase = new ListAuditLogUseCase();

export async function listAuditLog(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { userId, action, from, to, page, limit } =
    req.query as unknown as AuditLogQueryDTO;

  const result = await listAuditLogUseCase.execute({
    userId,
    action,
    from,
    to,
    page,
    limit,
  });

  sendPaginated(res, result.data, result.pagination);
}
