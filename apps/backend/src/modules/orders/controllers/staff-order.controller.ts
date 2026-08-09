import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetStaffOrderDetailsUseCase } from "../use-cases/get-staff-order-details.use-case.js";

const getStaffOrderDetailsUseCase = new GetStaffOrderDetailsUseCase();

export async function getStaffOrderDetails(
  req: AuthenticatedRequest<{ orderId: string }>,
  res: Response,
  next: NextFunction,
) {
  const details = await getStaffOrderDetailsUseCase.execute(
    req.params.orderId,
  );
  sendSuccess(res, details);
}
