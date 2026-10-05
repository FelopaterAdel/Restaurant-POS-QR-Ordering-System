import { UserRole } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { UserRepository } from "../repositories/user.repository.js";
import { UserNotFoundError } from "../use-cases/create-user.use-case.js";
import {
  CannotDeleteSelfError,
  DeleteUserUseCase,
  LastOwnerError,
} from "../use-cases/delete-user.use-case.js";
import { buildUser } from "./user.fixture.js";

function createMockRepository(
  overrides: Partial<UserRepository> = {},
): UserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findAll: vi.fn(),
    findOwner: vi.fn(),
    countActiveOwners: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateLastLoginAt: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as UserRepository;
}

describe("DeleteUserUseCase", () => {
  it("deactivates another user", async () => {
    const repository = createMockRepository();
    const useCase = new DeleteUserUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(buildUser());
    vi.mocked(repository.delete).mockResolvedValueOnce(buildUser());

    await useCase.execute({ userId: "user_1", actorId: "owner_1" });

    expect(repository.delete).toHaveBeenCalledWith("user_1");
  });

  it("refuses to delete your own account", async () => {
    const repository = createMockRepository();
    const useCase = new DeleteUserUseCase(repository);

    await expect(
      useCase.execute({ userId: "owner_1", actorId: "owner_1" }),
    ).rejects.toBeInstanceOf(CannotDeleteSelfError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("throws when the user does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new DeleteUserUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({ userId: "missing", actorId: "owner_1" }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("refuses to delete the last active owner", async () => {
    const repository = createMockRepository();
    const useCase = new DeleteUserUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(
      buildUser({ id: "owner_1", role: UserRole.OWNER }),
    );
    vi.mocked(repository.countActiveOwners).mockResolvedValueOnce(1);

    await expect(
      useCase.execute({ userId: "owner_1", actorId: "owner_2" }),
    ).rejects.toBeInstanceOf(LastOwnerError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("allows deleting an owner while others remain", async () => {
    const repository = createMockRepository();
    const useCase = new DeleteUserUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(
      buildUser({ id: "owner_1", role: UserRole.OWNER }),
    );
    vi.mocked(repository.countActiveOwners).mockResolvedValueOnce(2);
    vi.mocked(repository.delete).mockResolvedValueOnce(buildUser());

    await useCase.execute({ userId: "owner_1", actorId: "owner_2" });

    expect(repository.delete).toHaveBeenCalledWith("owner_1");
  });
});
