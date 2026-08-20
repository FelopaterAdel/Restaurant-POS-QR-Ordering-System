import type { UserRole } from "@restaurant/database";
import { ConflictError, NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { toAdminUser, type AdminUser } from "../../../utils/user.mapper.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  updateUserProfileSchema,
  type UpdateUserProfileDTO,
} from "../schemas/update-user-profile.schema.js";

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.USER_NOT_FOUND, "User not found");
    this.name = "UserNotFoundError";
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor() {
    super(AppErrorCode.EMAIL_ALREADY_EXISTS, "Email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export class CannotModifyOwnerError extends ConflictError {
  constructor() {
    super(AppErrorCode.FORBIDDEN, "Cannot modify the owner account");
    this.name = "CannotModifyOwnerError";
  }
}

export class UpdateUserProfileUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async execute(
    userId: string,
    input: UpdateUserProfileDTO,
  ): Promise<AdminUser> {
    const data = updateUserProfileSchema.parse(input);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.role === "OWNER") {
      throw new CannotModifyOwnerError();
    }

    if (data.email !== user.email) {
      const existing = await this.userRepository.findByEmail(data.email);
      if (existing) {
        throw new EmailAlreadyExistsError();
      }
    }

    const updated = await this.userRepository.update(userId, {
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
    });

    return toAdminUser(updated);
  }
}
