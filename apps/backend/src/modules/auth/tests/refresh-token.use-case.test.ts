import { UserRole, UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import type { JWTService } from "../../../infra/auth/jwt.service.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import { buildUser } from "../../users/tests/user.fixture.js";
import type { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import {
  InvalidRefreshTokenError,
  RefreshTokenUseCase,
} from "../use-cases/refresh-token.use-case.js";

function buildStoredToken(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "rt_1",
    userId: "user_1",
    tokenHash: "hash",
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createMocks() {
  const jwtService = {
    verifyRefreshToken: vi.fn(),
    generateAccessToken: vi.fn().mockReturnValue("new-access-token"),
    generateRefreshToken: vi.fn().mockReturnValue("new-refresh-token"),
  } as unknown as JWTService;

  const userRepository = {
    findById: vi.fn(),
  } as unknown as UserRepository;

  const refreshTokenRepository = {
    findByTokenHash: vi.fn(),
    revoke: vi.fn(),
    create: vi.fn(),
  } as unknown as RefreshTokenRepository;

  const useCase = new RefreshTokenUseCase(
    userRepository,
    jwtService,
    refreshTokenRepository,
  );

  return {
    useCase,
    jwtService,
    userRepository,
    refreshTokenRepository,
  };
}

describe("RefreshTokenUseCase", () => {
  it("rotates a valid refresh token", async () => {
    const { useCase, jwtService, userRepository, refreshTokenRepository } =
      createMocks();
    const user = buildUser({ id: "user_1", role: UserRole.OWNER });

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce({
      sub: "user_1",
      role: UserRole.OWNER,
      iat: 0,
      exp: 0,
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValueOnce(
      buildStoredToken() as never,
    );
    vi.mocked(userRepository.findById).mockResolvedValueOnce(user);

    const result = await useCase.execute({ refreshToken: "refresh-token" });

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("rt_1");
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });

  it("rejects an unknown refresh token", async () => {
    const { useCase, jwtService, refreshTokenRepository } = createMocks();

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce({
      sub: "user_1",
      role: UserRole.CASHIER,
      iat: 0,
      exp: 0,
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValueOnce(
      null,
    );

    await expect(
      useCase.execute({ refreshToken: "unknown-token" }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("rejects a revoked refresh token", async () => {
    const { useCase, jwtService, refreshTokenRepository } = createMocks();

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce({
      sub: "user_1",
      role: UserRole.CASHIER,
      iat: 0,
      exp: 0,
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValueOnce(
      buildStoredToken({ revokedAt: new Date() }) as never,
    );

    await expect(
      useCase.execute({ refreshToken: "revoked-token" }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("rejects an expired refresh token", async () => {
    const { useCase, jwtService, refreshTokenRepository } = createMocks();

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce({
      sub: "user_1",
      role: UserRole.CASHIER,
      iat: 0,
      exp: 0,
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValueOnce(
      buildStoredToken({
        expiresAt: new Date(Date.now() - 60_000),
      }) as never,
    );

    await expect(
      useCase.execute({ refreshToken: "expired-token" }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("rejects a token whose signature fails to verify", async () => {
    const { useCase, jwtService } = createMocks();

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce(null);

    await expect(
      useCase.execute({ refreshToken: "tampered-token" }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("rejects a token for an inactive user", async () => {
    const { useCase, jwtService, userRepository, refreshTokenRepository } =
      createMocks();
    const user = buildUser({ status: UserStatus.INACTIVE });

    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce({
      sub: "user_1",
      role: UserRole.CASHIER,
      iat: 0,
      exp: 0,
    });
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValueOnce(
      buildStoredToken() as never,
    );
    vi.mocked(userRepository.findById).mockResolvedValueOnce(user);

    await expect(
      useCase.execute({ refreshToken: "inactive-user-token" }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
