import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import { GetPublicMenuUseCase } from "../use-cases/get-public-menu.use-case.js";

const getPublicMenuUseCase = new GetPublicMenuUseCase();

export async function getPublicMenu(
  req: Request<{ qrCode: string }>,
  res: Response,
  next: NextFunction,
) {
  const menu = await getPublicMenuUseCase.execute(req.params.qrCode);
  sendSuccess(res, menu);
}
