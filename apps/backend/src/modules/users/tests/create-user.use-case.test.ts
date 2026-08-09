import { Prisma, UserRole, UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import type { PasswordService } from "../../../infra/security/password.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createUserSchema } from "../schemas/create-user.schema.js";
import { buildUser } from "./user.fixture.js";
import {
  CreateUserUseCase,
  EmailAlreadyExistsError,
} from "../use-cases/create-user.use-case.js";

function createMocks() {
  const userRepository = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  } as unknown as UserRepository;

  const passwordService = {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  } as unknown as PasswordService;

  const useCase = new CreateUserUseCase(userRepository, passwordService);

  return { useCase, userRepository, passwordService };
}

const staffInput = {
  name: "Waiter",
  email: "waiter@example.com",
  password: "StrongPass1!",
  role: UserRole.WAITER,
};

describe("CreateUserUseCase", () => {
  it("creates a staff member with the requested role", async () => {
    const { useCase, userRepository } = createMocks();
    const created = buildUser({
      id: "user_staff",
      email: staffInput.email,
      name: staffInput.name,
      role: UserRole.WAITER,
    });

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(userRepository.create).mockResolvedValueOnce(created);

    const result = await useCase.execute(staffInput);

    expect(userRepository.create).toHaveBeenCalledWith({
      email: staffInput.email,
      name: staffInput.name,
      password: "hashed-password",
      role: UserRole.WAITER,
    });
    expect(result.role).toBe(UserRole.WAITER);
  });

  it("defaults to CASHIER when no role is provided", async () => {
    const { useCase, userRepository } = createMocks();
    const withoutRole = {
      name: staffInput.name,
      email: staffInput.email,
      password: staffInput.password,
    };

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(userRepository.create).mockImplementationOnce(
      async (input) =>
        buildUser({
          email: input.email,
          name: input.name,
          role: input.role,
        }) as never,
    );

    const result = await useCase.execute(withoutRole);

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: UserRole.CASHIER }),
    );
    expect(result.role).toBe(UserRole.CASHIER);
  });

  it("rejects the OWNER role through the schema", async () => {
    const result = createUserSchema.safeParse({
      ...staffInput,
      role: UserRole.OWNER,
    });

    expect(result.success).toBe(false);
  });

  it("throws EmailAlreadyExistsError for a duplicate email", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ email: staffInput.email });

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(existing);

    await expect(useCase.execute(staffInput)).rejects.toBeInstanceOf(
      EmailAlreadyExistsError,
    );
  });

  it("maps a unique-constraint race to EmailAlreadyExistsError", async () => {
    const { useCase, userRepository } = createMocks();

    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(userRepository.create).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7",
      }),
    );

    await expect(useCase.execute(staffInput)).rejects.toBeInstanceOf(
      EmailAlreadyExistsError,
    );
  });
});
