import { UserRole, UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { UserRepository } from "../repositories/user.repository.js";
import { buildUser } from "./user.fixture.js";
import {
  UpdateUserProfileUseCase,
  CannotModifyOwnerError,
  EmailAlreadyExistsError,
  UserNotFoundError,
} from "../use-cases/update-user-profile.use-case.js";

function createMocks() {
  const userRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn(),
  } as unknown as UserRepository;

  const useCase = new UpdateUserProfileUseCase(userRepository);

  return { useCase, userRepository };
}

const staffInput = {
  name: "Updated Name",
  email: "updated@example.com",
  role: UserRole.WAITER,
};

describe("UpdateUserProfileUseCase", () => {
  it("updates staff profile with new name, email, and role", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1", role: UserRole.CASHIER });
    const updated = buildUser({
      id: "user_1",
      name: staffInput.name,
      email: staffInput.email,
      role: UserRole.WAITER,
    });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(userRepository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("user_1", staffInput);

    expect(result.name).toBe(staffInput.name);
    expect(result.email).toBe(staffInput.email);
    expect(result.role).toBe(UserRole.WAITER);
  });

  it("throws UserNotFoundError when user does not exist", async () => {
    const { useCase, userRepository } = createMocks();

    vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("nonexistent", staffInput),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("throws CannotModifyOwnerError when trying to edit owner", async () => {
    const { useCase, userRepository } = createMocks();
    const owner = buildUser({ id: "user_1", role: UserRole.OWNER });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(owner);

    await expect(
      useCase.execute("user_1", staffInput),
    ).rejects.toBeInstanceOf(CannotModifyOwnerError);
  });

  it("throws EmailAlreadyExistsError for duplicate email", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1", email: "old@example.com" });
    const conflict = buildUser({ id: "user_2", email: "taken@example.com" });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(conflict);

    await expect(
      useCase.execute("user_1", {
        ...staffInput,
        email: "taken@example.com",
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });

  it("allows keeping the same email without triggering duplicate", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({
      id: "user_1",
      email: "current@example.com",
    });
    const updated = buildUser({
      id: "user_1",
      name: staffInput.name,
      email: "current@example.com",
      role: UserRole.WAITER,
    });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(userRepository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("user_1", {
      ...staffInput,
      email: "current@example.com",
    });

    expect(result.email).toBe("current@example.com");
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it("rejects invalid role through schema validation", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1" });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);

    await expect(
      useCase.execute("user_1", {
        ...staffInput,
        role: "INVALID_ROLE" as never,
      }),
    ).rejects.toThrow();
  });

  it("rejects OWNER role through schema validation", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1" });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);

    await expect(
      useCase.execute("user_1", {
        ...staffInput,
        role: UserRole.OWNER as never,
      }),
    ).rejects.toThrow();
  });

  it("rejects name shorter than 2 characters", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1" });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);

    await expect(
      useCase.execute("user_1", {
        ...staffInput,
        name: "A",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid email format", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({ id: "user_1" });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);

    await expect(
      useCase.execute("user_1", {
        ...staffInput,
        email: "not-an-email",
      }),
    ).rejects.toThrow();
  });

  it("preserves status when updating profile", async () => {
    const { useCase, userRepository } = createMocks();
    const existing = buildUser({
      id: "user_1",
      status: UserStatus.SUSPENDED,
      role: UserRole.CASHIER,
    });
    const updated = buildUser({
      id: "user_1",
      name: staffInput.name,
      email: staffInput.email,
      role: UserRole.WAITER,
      status: UserStatus.SUSPENDED,
    });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(userRepository.findByEmail).mockResolvedValueOnce(null);
    vi.mocked(userRepository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("user_1", staffInput);

    expect(result.status).toBe(UserStatus.SUSPENDED);
    expect(userRepository.update).toHaveBeenCalledWith("user_1", {
      name: staffInput.name,
      email: staffInput.email,
      role: UserRole.WAITER,
    });
  });
});
