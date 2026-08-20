import { UserStatus } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { toAdminUser, type AdminUser } from "../../../utils/user.mapper.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  updateUserStatusSchema,
  type UpdateUserStatusDTO,
} from "../schemas/update-user-status.schema.js";
import { UserNotFoundError } from "./create-user.use-case.js";

const USER_STATUS_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.INACTIVE],
  [UserStatus.SUSPENDED]: [UserStatus.ACTIVE],
  [UserStatus.INACTIVE]: [UserStatus.ACTIVE],
};

export class InvalidUserStatusTransitionError extends ConflictError {
  constructor(from: UserStatus, to: UserStatus) {
    super(
      AppErrorCode.USER_INVALID_STATUS,
      `Cannot change user status from ${from} to ${to}`,
    );
    this.name = "InvalidUserStatusTransitionError";
  }
}

export class UpdateUserStatusUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async execute(
    userId: string,
    input: UpdateUserStatusDTO,
  ): Promise<AdminUser> {
    const data = updateUserStatusSchema.parse(input);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const allowedTransitions = USER_STATUS_TRANSITIONS[user.status];
    if (!allowedTransitions.includes(data.status)) {
      throw new InvalidUserStatusTransitionError(user.status, data.status);
    }

    const updated = await this.userRepository.update(userId, {
      status: data.status,
    });

    return toAdminUser(updated);
  }
}
