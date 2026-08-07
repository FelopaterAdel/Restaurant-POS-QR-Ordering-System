import { Prisma, type User, type UserRole } from "@restaurant/database";
import { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { registerSchema, type RegisterDTO } from "../schemas/register.schema.js";

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: User["status"];
}

export class RegisterUseCase {
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    passwordService: PasswordService = new PasswordService(),
  ) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(input: RegisterDTO): Promise<SafeUser> {
    const data = registerSchema.parse(input);

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new EmailAlreadyExistsError();
    }

    const hashedPassword = await this.passwordService.hash(data.password);

    const user = await this.createUser(data, hashedPassword);

    return this.toSafeUser(user);
  }

  private async createUser(
    data: RegisterDTO,
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
        throw new EmailAlreadyExistsError();
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
