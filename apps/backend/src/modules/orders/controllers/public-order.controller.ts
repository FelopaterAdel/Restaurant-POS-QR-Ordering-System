import type { NextFunction, Request, Response } from "express";
import {
  CreateOrderUseCase,
  ProductNotFoundError,
  ProductUnavailableError,
  TableDisabledError,
  TableNotFoundError,
} from "../use-cases/create-order.use-case.js";

const createOrderUseCase = new CreateOrderUseCase();

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await createOrderUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof TableDisabledError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (
      error instanceof ProductNotFoundError ||
      error instanceof ProductUnavailableError
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}
