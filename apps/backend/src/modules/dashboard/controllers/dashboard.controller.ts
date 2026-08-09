import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import type { DashboardQueryDTO } from "../schemas/dashboard-query.schema.js";
import { GetDashboardSummaryUseCase } from "../use-cases/get-dashboard-summary.use-case.js";

const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase();

export async function getDashboardSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { date } = req.query as unknown as DashboardQueryDTO;

    const result = await getDashboardSummaryUseCase.execute({ date });

    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
