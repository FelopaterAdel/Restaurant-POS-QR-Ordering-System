import { NextFunction, Request, Response } from "express";
import {
  AccountNotActiveError,
  InvalidCredentialsError,
  LoginUseCase,
} from "../use-cases/login.use-case.js";
import {
  EmailAlreadyExistsError,
  RegisterUseCase,
} from "../use-cases/register.use-case.js";

const loginUseCase = new LoginUseCase();
const registerUseCase = new RegisterUseCase();

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
