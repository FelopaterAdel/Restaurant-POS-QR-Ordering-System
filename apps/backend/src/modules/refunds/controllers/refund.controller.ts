import type { NextFunction, Request, Response } from "express";
import { RefundStatus } from "@restaurant/database";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { ListRefundsUseCase } from "../use-cases/list-refunds.use-case.js";
import { RequestRefundUseCase } from "../use-cases/request-refund.use-case.js";
import {
  ApproveRefundUseCase,
  RejectRefundUseCase,
} from "../use-cases/review-refund.use-case.js";

const requestRefundUseCase = new RequestRefundUseCase();
const listRefundsUseCase = new ListRefundsUseCase();
const approveRefundUseCase = new ApproveRefundUseCase();
const rejectRefundUseCase = new RejectRefundUseCase();

export async function requestRefund(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const refund = await requestRefundUseCase.execute({
    input: req.body,
    requestedBy: req.user.id,
  });
  sendSuccess(res, refund, 201);
}

export async function listRefunds(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const status =
    typeof req.query.status === "string"
      ? (req.query.status as RefundStatus)
      : RefundStatus.PENDING;
  const refunds = await listRefundsUseCase.execute(status);
  sendSuccess(res, refunds);
}

export async function approveRefund(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const refund = await approveRefundUseCase.execute({
    id: req.params.id,
    input: req.body ?? {},
    reviewerId: req.user.id,
  });
  sendSuccess(res, refund);
}

export async function rejectRefund(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const refund = await rejectRefundUseCase.execute({
    id: req.params.id,
    input: req.body ?? {},
    reviewerId: req.user.id,
  });
  sendSuccess(res, refund);
}
