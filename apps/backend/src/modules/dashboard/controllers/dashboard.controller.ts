import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import type { DashboardQueryDTO } from "../schemas/dashboard-query.schema.js";
import { GetDashboardSummaryUseCase } from "../use-cases/get-dashboard-summary.use-case.js";

const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase();

export async function getDashboardSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { date } = req.query as unknown as DashboardQueryDTO;

  const result = await getDashboardSummaryUseCase.execute({ date });

  sendSuccess(res, result);
}
