import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import type { DashboardQueryDTO } from "../schemas/dashboard-query.schema.js";
import type {
  RevenueTrendQueryDTO,
  TopProductsQueryDTO,
} from "../schemas/analytics-query.schema.js";
import { GetDashboardSummaryUseCase } from "../use-cases/get-dashboard-summary.use-case.js";
import { GetRevenueTrendUseCase } from "../use-cases/get-revenue-trend.use-case.js";
import { GetStockSummaryUseCase } from "../use-cases/get-stock-summary.use-case.js";
import { GetTopProductsUseCase } from "../use-cases/get-top-products.use-case.js";

const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase();
const getTopProductsUseCase = new GetTopProductsUseCase();
const getRevenueTrendUseCase = new GetRevenueTrendUseCase();
const getStockSummaryUseCase = new GetStockSummaryUseCase();

export async function getDashboardSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { date, from, to } = req.query as unknown as DashboardQueryDTO;

  const result = await getDashboardSummaryUseCase.execute({ date, from, to });

  sendSuccess(res, result);
}

export async function getTopProducts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { from, to, limit } = req.query as unknown as TopProductsQueryDTO;

  const result = await getTopProductsUseCase.execute({ from, to, limit });

  sendSuccess(res, result);
}

export async function getRevenueTrend(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { from, to, granularity } =
    req.query as unknown as RevenueTrendQueryDTO;

  const result = await getRevenueTrendUseCase.execute({
    from,
    to,
    granularity,
  });

  sendSuccess(res, result);
}

export async function getStockSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const result = await getStockSummaryUseCase.execute();

  sendSuccess(res, result);
}
