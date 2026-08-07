import type { User, UserRole } from "@restaurant/database";
import { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { loginSchema, type LoginDTO } from "../schemas/login.schema.js";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountNotActiveError extends Error {
  constructor() {
    super("Account is not active");
    this.name = "AccountNotActiveError";
  }
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: User["status"];
  lastLoginAt: Date;
}

export class LoginUseCase {
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    passwordService: PasswordService = new PasswordService(),
  ) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute(input: LoginDTO): Promise<SafeUser> {
    const data = loginSchema.parse(input);

    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordService.compare(
      data.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (user.status !== "ACTIVE") {
      throw new AccountNotActiveError();
    }

    const lastLoginAt = new Date();
    const updatedUser = await this.userRepository.updateLastLoginAt(
      user.id,
      lastLoginAt,
    );

    return this.toSafeUser(updatedUser);
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? new Date(),
    };
  }
}
