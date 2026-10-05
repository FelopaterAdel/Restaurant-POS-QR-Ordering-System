import { AppError, ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserNotFoundError } from "./create-user.use-case.js";

export class CannotDeleteSelfError extends AppError {
  constructor() {
    super(
      403,
      AppErrorCode.USER_CANNOT_DELETE_SELF,
      "You cannot delete your own account",
    );
    this.name = "CannotDeleteSelfError";
  }
}

export class LastOwnerError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.USER_LAST_OWNER,
      "Cannot delete the last active owner",
    );
    this.name = "LastOwnerError";
  }
}

export interface DeleteUserParams {
  userId: string;
  actorId: string;
}

export class DeleteUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async execute(params: DeleteUserParams): Promise<void> {
    if (params.userId === params.actorId) {
      throw new CannotDeleteSelfError();
    }

    const user = await this.userRepository.findById(params.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.role === "OWNER" && user.status === "ACTIVE") {
      const owners = await this.userRepository.countActiveOwners();
      if (owners <= 1) {
        throw new LastOwnerError();
      }
    }

    await this.userRepository.delete(params.userId);
  }
}
