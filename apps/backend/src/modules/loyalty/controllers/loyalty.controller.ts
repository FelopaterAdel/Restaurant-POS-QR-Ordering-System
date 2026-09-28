import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import { GetLoyaltyBalanceUseCase } from "../use-cases/get-loyalty-balance.use-case.js";

const getLoyaltyBalanceUseCase = new GetLoyaltyBalanceUseCase();

export async function getLoyaltyBalance(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const phone = req.query.phone as string;
  const balance = await getLoyaltyBalanceUseCase.execute(phone);
  sendSuccess(res, balance);
}
