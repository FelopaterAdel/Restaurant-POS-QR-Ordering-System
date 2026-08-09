import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { BootstrapOwnerUseCase } from "../use-cases/bootstrap-owner.use-case.js";
import { LogoutUseCase } from "../use-cases/logout.use-case.js";
import { LoginUseCase } from "../use-cases/login.use-case.js";
import { RefreshTokenUseCase } from "../use-cases/refresh-token.use-case.js";

const loginUseCase = new LoginUseCase();
const bootstrapOwnerUseCase = new BootstrapOwnerUseCase();
const refreshTokenUseCase = new RefreshTokenUseCase();
const logoutUseCase = new LogoutUseCase();

export async function login(req: Request, res: Response, next: NextFunction) {
  const result = await loginUseCase.execute(req.body);
  sendSuccess(res, result);
}

export async function bootstrapOwner(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = await bootstrapOwnerUseCase.execute(req.body);
  sendSuccess(res, user, 201);
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  const result = await refreshTokenUseCase.execute(req.body);
  sendSuccess(res, result);
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  await logoutUseCase.execute(req.body);
  sendSuccess(res, null);
}

export async function me(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) {
  sendSuccess(res, req.user);
}
