import type { NextFunction, Response } from "express";
import type { User } from "@restaurant/database";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  CreateUserUseCase,
  UserNotFoundError,
} from "../use-cases/create-user.use-case.js";

const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase();

function toSafeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const user = await createUserUseCase.execute(req.body);
  sendSuccess(res, user, 201);
}

export async function listUsers(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const users = await userRepository.findAll();
  sendSuccess(res, users.map(toSafeUser));
}

export async function deleteUser(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;

  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new UserNotFoundError();
  }

  await userRepository.delete(id);

  sendSuccess(res, null);
}
