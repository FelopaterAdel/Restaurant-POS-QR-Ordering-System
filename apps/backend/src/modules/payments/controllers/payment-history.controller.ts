import type { NextFunction, Response } from "express";
import { sendPaginated, sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import type {
  PaymentHistoryQueryDTO,
  PaymentSummaryQueryDTO,
} from "../schemas/payment-history-query.schema.js";
import {
  GetPaymentHistoryUseCase,
  GetPaymentSummaryUseCase,
} from "../use-cases/get-payment-history.use-case.js";

const getPaymentHistoryUseCase = new GetPaymentHistoryUseCase();
const getPaymentSummaryUseCase = new GetPaymentSummaryUseCase();

export async function getPaymentHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { from, to, orderNumber, page, limit } =
    req.query as unknown as PaymentHistoryQueryDTO;

  const result = await getPaymentHistoryUseCase.execute({
    from,
    to,
    orderNumber,
    page,
    limit,
  });

  sendPaginated(res, result.data, result.pagination);
}

export async function getPaymentSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { from, to, orderNumber } =
    req.query as unknown as PaymentSummaryQueryDTO;

  const result = await getPaymentSummaryUseCase.execute({
    from,
    to,
    orderNumber,
  });

  sendSuccess(res, result);
}
