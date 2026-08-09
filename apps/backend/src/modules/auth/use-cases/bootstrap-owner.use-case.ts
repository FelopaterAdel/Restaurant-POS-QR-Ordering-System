import { Prisma, type User, type UserRole } from "@restaurant/database";
import { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import {
  bootstrapOwnerSchema,
  type BootstrapOwnerDTO,
} from "../schemas/bootstrap-owner.schema.js";

export class OwnerAlreadyExistsError extends Error {
  constructor() {
    super("Owner bootstrap has already been completed");
    this.name = "OwnerAlreadyExistsError";
  }
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: User["status"];
}

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

    return this.toSafeUser(user);
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

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
