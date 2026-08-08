import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { GetStaffOrderDetailsUseCase } from "../use-cases/get-staff-order-details.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";

const getStaffOrderDetailsUseCase = new GetStaffOrderDetailsUseCase();

export async function getStaffOrderDetails(
  req: AuthenticatedRequest<{ orderId: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const details = await getStaffOrderDetailsUseCase.execute(
      req.params.orderId,
    );

    res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      data: details,
    });
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}
