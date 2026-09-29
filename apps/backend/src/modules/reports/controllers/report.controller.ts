import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import {
  GetLatestReportUseCase,
  ListReportsUseCase,
} from "../use-cases/list-reports.use-case.js";
import { GenerateDailyReportUseCase } from "../use-cases/generate-daily-report.use-case.js";

const listReportsUseCase = new ListReportsUseCase();
const getLatestReportUseCase = new GetLatestReportUseCase();
const generateDailyReportUseCase = new GenerateDailyReportUseCase();

export async function listReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const reports = await listReportsUseCase.execute();
  sendSuccess(res, reports);
}

export async function getLatestReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const report = await getLatestReportUseCase.execute();
  sendSuccess(res, report);
}

export async function generateReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const report = await generateDailyReportUseCase.execute(req.body ?? {});
  sendSuccess(res, report, 201);
}
