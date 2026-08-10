import type { SignOptions } from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { UnauthorizedError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { JWTService } from "../../../infra/auth/jwt.service.js";
import { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { calculateRefreshExpiry } from "../../../utils/token-expiry.js";
import { toSafeUser, type SafeUser } from "../../../utils/user.mapper.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import { loginSchema, type LoginDTO } from "../schemas/login.schema.js";

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password", AppErrorCode.INVALID_CREDENTIALS);
    this.name = "InvalidCredentialsError";
  }
}

export class AccountNotActiveError extends UnauthorizedError {
  constructor() {
    super("Account is not active", AppErrorCode.ACCOUNT_NOT_ACTIVE);
    this.name = "AccountNotActiveError";
  }
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
    const expiresAt = calculateRefreshExpiry(this.refreshExpiresIn);

    await this.refreshTokenRepository.create(
      user.id,
      tokenHash,
      expiresAt,
    );

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }
}
