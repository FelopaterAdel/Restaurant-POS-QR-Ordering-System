import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { toAdminUser } from "../../../utils/user.mapper.js";
import { UserRepository } from "../repositories/user.repository.js";
import { CreateUserUseCase } from "../use-cases/create-user.use-case.js";
import { DeleteUserUseCase } from "../use-cases/delete-user.use-case.js";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case.js";
import { UpdateUserStatusUseCase } from "../use-cases/update-user-status.use-case.js";

const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase();
const deleteUserUseCase = new DeleteUserUseCase();
const updateUserProfileUseCase = new UpdateUserProfileUseCase();
const updateUserStatusUseCase = new UpdateUserStatusUseCase();

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
  sendSuccess(res, users.map(toAdminUser));
}

export async function deleteUser(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  await deleteUserUseCase.execute({
    userId: req.params.id,
    actorId: req.user.id,
  });

  sendSuccess(res, null);
}

export async function updateUserProfile(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const result = await updateUserProfileUseCase.execute(req.params.id, req.body);
  sendSuccess(res, result);
}

export async function updateUserStatus(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const result = await updateUserStatusUseCase.execute(req.params.id, req.body);
  sendSuccess(res, result);
}
