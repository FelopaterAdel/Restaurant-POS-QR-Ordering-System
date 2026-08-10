import { Prisma, type User } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { PasswordService } from "../../../infra/security/password.service.js";
import { toSafeUser, type SafeUser } from "../../../utils/user.mapper.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import {
  bootstrapOwnerSchema,
  type BootstrapOwnerDTO,
} from "../schemas/bootstrap-owner.schema.js";

export class OwnerAlreadyExistsError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.OWNER_ALREADY_EXISTS,
      "Owner bootstrap has already been completed",
    );
    this.name = "OwnerAlreadyExistsError";
  }
}

export type { SafeUser };

export class BootstrapOwnerUseCase {
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    passwordService: PasswordService = new PasswordService(),
  ) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(input: BootstrapOwnerDTO): Promise<SafeUser> {
    const data = bootstrapOwnerSchema.parse(input);

    const existingOwner = await this.userRepository.findOwner();
    if (existingOwner) {
      throw new OwnerAlreadyExistsError();
    }

    const hashedPassword = await this.passwordService.hash(data.password);

    const user = await this.createOwner(data, hashedPassword);

    return toSafeUser(user);
  }

  private async createOwner(
    data: BootstrapOwnerDTO,
    hashedPassword: string,
  ): Promise<User> {
    try {
      return await this.userRepository.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "OWNER",
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new OwnerAlreadyExistsError();
      }
      throw error;
    }
  }
}
