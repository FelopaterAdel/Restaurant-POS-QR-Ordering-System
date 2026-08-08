import type { NextFunction, Response } from "express";
import type { User } from "@restaurant/database";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { UserRepository } from "../repositories/user.repository.js";

const userRepository = new UserRepository();

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

export async function listUsers(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await userRepository.findAll();

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users.map(toSafeUser),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const existing = await userRepository.findById(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    await userRepository.delete(id);

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
}
