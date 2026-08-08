import type { User, UserRole } from "@restaurant/database";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { JWTService } from "../../../infra/auth/jwt.service.js";
import { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
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
}

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;
  private readonly jwtService: JWTService;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly refreshExpiresIn: SignOptions["expiresIn"];

  constructor(
    userRepository: UserRepository = new UserRepository(),
    passwordService: PasswordService = new PasswordService(),
    jwtService: JWTService = new JWTService(
      env.jwt.accessSecret,
      env.jwt.refreshSecret,
      env.jwt.accessExpiresIn,
      env.jwt.refreshExpiresIn,
    ),
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
  ) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.refreshExpiresIn = env.jwt.refreshExpiresIn;
  }

  async execute(input: LoginDTO): Promise<LoginResult> {
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

    await this.userRepository.updateLastLoginAt(user.id, new Date());

    const tokenPayload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const refreshToken = this.jwtService.generateRefreshToken(tokenPayload);

    const tokenHash = RefreshTokenRepository.hashToken(refreshToken);
    const expiresAt = this.calculateRefreshExpiry();

    await this.refreshTokenRepository.create(
      user.id,
      tokenHash,
      expiresAt,
    );

    return {
      user: this.toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private calculateRefreshExpiry(): Date {
    const expiresIn = this.refreshExpiresIn ?? "7d";
    const value = Number.parseInt(String(expiresIn), 10);
    const unit = String(expiresIn).replace(/[0-9]/g, "");

    const now = Date.now();
    switch (unit) {
      case "s":
        return new Date(now + value * 1000);
      case "m":
        return new Date(now + value * 60 * 1000);
      case "h":
        return new Date(now + value * 60 * 60 * 1000);
      case "d":
        return new Date(now + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
