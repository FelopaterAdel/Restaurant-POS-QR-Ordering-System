import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import {
  defaultOnlineProviders,
  listConfiguredProviders,
} from "../../../infra/online-providers.js";

const providers = defaultOnlineProviders();

export async function listPaymentProviders(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  sendSuccess(res, listConfiguredProviders(providers));
}
