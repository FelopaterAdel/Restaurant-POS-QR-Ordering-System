import type { NextFunction, Request, Response } from "express";
import {
  GetPublicMenuUseCase,
  TableDisabledError,
  TableNotFoundError,
} from "../use-cases/get-public-menu.use-case.js";

const getPublicMenuUseCase = new GetPublicMenuUseCase();

export async function getPublicMenu(
  req: Request<{ qrCode: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const menu = await getPublicMenuUseCase.execute(req.params.qrCode);

    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    if (error instanceof TableNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof TableDisabledError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}
