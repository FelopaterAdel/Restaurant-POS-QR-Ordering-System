import { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { LogoutUseCase } from "../use-cases/logout.use-case.js";
import {
  AccountNotActiveError,
  InvalidCredentialsError,
  LoginUseCase,
} from "../use-cases/login.use-case.js";
import {
  InvalidRefreshTokenError,
  RefreshTokenUseCase,
} from "../use-cases/refresh-token.use-case.js";
import {
  EmailAlreadyExistsError,
  RegisterUseCase,
} from "../use-cases/register.use-case.js";

const loginUseCase = new LoginUseCase();
const registerUseCase = new RegisterUseCase();
const refreshTokenUseCase = new RefreshTokenUseCase();
const logoutUseCase = new LogoutUseCase();

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUseCase.execute(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    if (error instanceof AccountNotActiveError) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await registerUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await refreshTokenUseCase.execute(req.body);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof InvalidRefreshTokenError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await logoutUseCase.execute(req.body);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) {
  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: req.user,
  });
}
