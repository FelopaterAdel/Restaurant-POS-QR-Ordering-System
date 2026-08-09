import { UserRole, UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import type { JWTService } from "../../../infra/auth/jwt.service.js";
import type { PasswordService } from "../../../infra/security/password.service.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import { buildUser } from "../../users/tests/user.fixture.js";
import type { RefreshTokenRepository } from "../repositories/refresh-token.repository.js";
import {
  AccountNotActiveError,
  InvalidCredentialsError,
  LoginUseCase,
} from "../use-cases/login.use-case.js";

function createMocks() {
  const userRepository = {
    findByEmail: vi.fn(),
    updateLastLoginAt: vi.fn(),
  } as unknown as UserRepository;

  const passwordService = {
    compare: vi.fn().mockResolvedValue(true),
  } as unknown as PasswordService;

  const jwtService = {
    generateAccessToken: vi.fn().mockReturnValue("access-token"),
    generateRefreshToken: vi.fn().mockReturnValue("refresh-token"),
  } as unknown as JWTService;

  const refreshTokenRepository = {
    create: vi.fn(),
  } as unknown as RefreshTokenRepository;

  const useCase = new LoginUseCase(
    userRepository,
    passwordService,
    jwtService,
    refreshTokenRepository,
  );

  return {
    useCase,
    userRepository,
    passwordService,
    jwtService,
    refreshTokenRepository,
  };
}

const credentials = {
  email: "cashier@example.com",
  password: "StrongPass1!",
};

describe("LoginUseCase", () => {
  it("returns tokens and the safe user for valid credentials", async () => {
    const {
      useCase,
      userRepository,
      passwordService,
      jwtService,
      refreshTokenRepository,
    } = createMocks();
    const user = buildUser({ role: UserRole.CASHIER });

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(user);

    const result = await useCase.execute(credentials);

    expect(passwordService.compare).toHaveBeenCalledWith(
      credentials.password,
      user.password,
    );
    expect(userRepository.updateLastLoginAt).toHaveBeenCalled();
    expect(jwtService.generateAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      role: UserRole.CASHIER,
    });
    expect(refreshTokenRepository.create).toHaveBeenCalledOnce();
    expect(result).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: UserRole.CASHIER,
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("throws InvalidCredentialsError when the user does not exist", async () => {
    const { useCase, userRepository } = createMocks();

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);

    await expect(useCase.execute(credentials)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it("throws InvalidCredentialsError for a wrong password", async () => {
    const { useCase, userRepository, passwordService } = createMocks();
    const user = buildUser();

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(user);
    vi.mocked(passwordService.compare).mockResolvedValueOnce(false);

    await expect(useCase.execute(credentials)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it("throws AccountNotActiveError for an inactive user", async () => {
    const { useCase, userRepository } = createMocks();
    const user = buildUser({ status: UserStatus.INACTIVE });

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(user);

    await expect(useCase.execute(credentials)).rejects.toBeInstanceOf(
      AccountNotActiveError,
    );
  });
});
