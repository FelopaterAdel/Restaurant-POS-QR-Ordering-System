import { Prisma, UserRole, UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import type { PasswordService } from "../../../infra/security/password.service.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import { buildUser } from "../../users/tests/user.fixture.js";
import {
  BootstrapOwnerUseCase,
  OwnerAlreadyExistsError,
} from "../use-cases/bootstrap-owner.use-case.js";

function createMocks() {
  const userRepository = {
    findByEmail: vi.fn(),
    findOwner: vi.fn(),
    create: vi.fn(),
  } as unknown as UserRepository;

  const passwordService = {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  } as unknown as PasswordService;

  const useCase = new BootstrapOwnerUseCase(userRepository, passwordService);

  return { useCase, userRepository, passwordService };
}

const validInput = {
  name: "Restaurant Owner",
  email: "owner@example.com",
  password: "StrongPass1!",
};

describe("BootstrapOwnerUseCase", () => {
  it("creates the first owner when no owner exists", async () => {
    const { useCase, userRepository } = createMocks();
    const owner = buildUser({
      id: "user_owner",
      email: validInput.email,
      name: validInput.name,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
    });

    vi.mocked(userRepository.findOwner).mockResolvedValueOnce(null);
    vi.mocked(userRepository.create).mockResolvedValueOnce(owner);

    const result = await useCase.execute(validInput);

    expect(userRepository.findOwner).toHaveBeenCalledOnce();
    expect(userRepository.create).toHaveBeenCalledWith({
      email: validInput.email,
      name: validInput.name,
      password: "hashed-password",
      role: "OWNER",
    });
    expect(result).toEqual({
      id: "user_owner",
      name: validInput.name,
      email: validInput.email,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
    });
  });

  it("rejects bootstrap when an owner already exists", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ role: UserRole.OWNER });

    vi.mocked(userRepository.findOwner).mockResolvedValueOnce(existing);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      OwnerAlreadyExistsError,
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("maps a unique-constraint race to OwnerAlreadyExistsError", async () => {
    const { useCase, userRepository } = createMocks();

    vi.mocked(userRepository.findOwner).mockResolvedValueOnce(null);
    vi.mocked(userRepository.create).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7",
      }),
    );

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      OwnerAlreadyExistsError,
    );
  });
});
