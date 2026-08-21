import { UserStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { UserRepository } from "../repositories/user.repository.js";
import { buildUser } from "./user.fixture.js";
import {
  InvalidUserStatusTransitionError,
  UpdateUserStatusUseCase,
} from "../use-cases/update-user-status.use-case.js";
import { UserNotFoundError } from "../use-cases/create-user.use-case.js";

function createMocks() {
  const userRepository = {
    findById: vi.fn(),
    update: vi.fn(),
  } as unknown as UserRepository;

  const useCase = new UpdateUserStatusUseCase(userRepository);

  return { useCase, userRepository };
}

describe("UpdateUserStatusUseCase", () => {
  it("suspends an ACTIVE user", async () => {
    const { useCase, userRepository } = createMocks();
    const active = buildUser({ id: "user_staff", status: UserStatus.ACTIVE });
    const suspended = buildUser({
      id: "user_staff",
      status: UserStatus.SUSPENDED,
    });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(active);
    vi.mocked(userRepository.update).mockResolvedValueOnce(suspended);

    const result = await useCase.execute("user_staff", {
      status: UserStatus.SUSPENDED,
    });

    expect(userRepository.update).toHaveBeenCalledWith("user_staff", {
      status: UserStatus.SUSPENDED,
    });
    expect(result.status).toBe(UserStatus.SUSPENDED);
  });

  it("reactivates a SUSPENDED user", async () => {
    const { useCase, userRepository } = createMocks();
    const suspended = buildUser({
      id: "user_staff",
      status: UserStatus.SUSPENDED,
    });
    const active = buildUser({ id: "user_staff", status: UserStatus.ACTIVE });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(suspended);
    vi.mocked(userRepository.update).mockResolvedValueOnce(active);

    const result = await useCase.execute("user_staff", {
      status: UserStatus.ACTIVE,
    });

    expect(result.status).toBe(UserStatus.ACTIVE);
  });

  it("reactivates an INACTIVE user", async () => {
    const { useCase, userRepository } = createMocks();
    const inactive = buildUser({
      id: "user_staff",
      status: UserStatus.INACTIVE,
    });
    const active = buildUser({ id: "user_staff", status: UserStatus.ACTIVE });

    vi.mocked(userRepository.findById).mockResolvedValueOnce(inactive);
    vi.mocked(userRepository.update).mockResolvedValueOnce(active);

    const result = await useCase.execute("user_staff", {
      status: UserStatus.ACTIVE,
    });

    expect(result.status).toBe(UserStatus.ACTIVE);
  });

  it.each([
    [UserStatus.SUSPENDED, UserStatus.INACTIVE],
    [UserStatus.INACTIVE, UserStatus.SUSPENDED],
    [UserStatus.ACTIVE, UserStatus.ACTIVE],
  ])(
    "rejects the invalid transition %s -> %s",
    async (from, to) => {
      const { useCase, userRepository } = createMocks();
      const current = buildUser({ id: "user_staff", status: from });

      vi.mocked(userRepository.findById).mockResolvedValueOnce(current);

      await expect(
        useCase.execute("user_staff", { status: to }),
      ).rejects.toBeInstanceOf(InvalidUserStatusTransitionError);
      expect(userRepository.update).not.toHaveBeenCalled();
    },
  );

  it("throws UserNotFoundError when the user does not exist", async () => {
    const { useCase, userRepository } = createMocks();

    vi.mocked(userRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("missing_user", { status: UserStatus.SUSPENDED }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("rejects an invalid status value through the schema", async () => {
    const { useCase, userRepository } = createMocks();

    await expect(
      useCase.execute("user_staff", {
        status: "NOT_A_STATUS" as never,
      }),
    ).rejects.toThrow();
    expect(userRepository.findById).not.toHaveBeenCalled();
  });
});
