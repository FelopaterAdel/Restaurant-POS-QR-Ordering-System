import type { SignOptions } from "jsonwebtoken";
import { env } from "../../../config/env.js";
import { JWTService } from "../../../infra/auth/jwt.service.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import {
  refreshTokenSchema,
  type RefreshTokenDTO,
} from "../schemas/refresh-token.schema.js";

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  private readonly userRepository: UserRepository;
  private readonly jwtService: JWTService;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly refreshExpiresIn: SignOptions["expiresIn"];

  constructor(
    userRepository: UserRepository = new UserRepository(),
    jwtService: JWTService = new JWTService(
      env.jwt.accessSecret,
      env.jwt.refreshSecret,
      env.jwt.accessExpiresIn,
      env.jwt.refreshExpiresIn,
    ),
    refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
  ) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.refreshExpiresIn = env.jwt.refreshExpiresIn;
  }

  async execute(input: RefreshTokenDTO): Promise<RefreshResult> {
    const { refreshToken } = refreshTokenSchema.parse(input);

    const decoded = this.jwtService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new InvalidRefreshTokenError();
    }

    const tokenHash = RefreshTokenRepository.hashToken(refreshToken);

    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!storedToken) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.revokedAt) {
      throw new InvalidRefreshTokenError();
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    if (decoded.sub !== storedToken.userId) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    if (user.status !== "ACTIVE") {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenRepository.revoke(storedToken.id);

    const tokenPayload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const newRefreshToken = this.jwtService.generateRefreshToken(tokenPayload);

    const newTokenHash = RefreshTokenRepository.hashToken(newRefreshToken);
    const expiresAt = this.calculateRefreshExpiry();

    await this.refreshTokenRepository.create(
      user.id,
      newTokenHash,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
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
}
