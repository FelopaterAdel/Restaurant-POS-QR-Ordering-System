import { NextFunction, Request, Response } from "express";
import {
  EmailAlreadyExistsError,
  RegisterUseCase,
} from "../use-cases/register.use-case.js";

const registerUseCase = new RegisterUseCase();

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
