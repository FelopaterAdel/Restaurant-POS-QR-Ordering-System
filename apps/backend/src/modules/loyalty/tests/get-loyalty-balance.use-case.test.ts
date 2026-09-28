import { describe, expect, it, vi } from "vitest";
import { LoyaltyRepository } from "../repositories/loyalty.repository.js";
import {
  GetLoyaltyBalanceUseCase,
  LoyaltyAccountNotFoundError,
} from "../use-cases/get-loyalty-balance.use-case.js";

describe("GetLoyaltyBalanceUseCase", () => {
  it("returns balance, lifetime and tier for a known phone", async () => {
    const repository = {
      findAccountByPhone: vi.fn().mockResolvedValue({
        id: "acc_1",
        phone: "01012345678",
      }),
      findEntriesByAccountId: vi.fn().mockResolvedValue([
        {
          points: 600,
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      ]),
    } as unknown as LoyaltyRepository;
    const useCase = new GetLoyaltyBalanceUseCase(repository);

    const result = await useCase.execute("01012345678");

    expect(repository.findAccountByPhone).toHaveBeenCalledWith("01012345678");
    expect(result).toEqual({
      phone: "01012345678",
      balance: 600,
      lifetimePoints: 600,
      tier: "Silver",
    });
  });

  it("throws when no account exists for the phone", async () => {
    const repository = {
      findAccountByPhone: vi.fn().mockResolvedValue(null),
      findEntriesByAccountId: vi.fn(),
    } as unknown as LoyaltyRepository;
    const useCase = new GetLoyaltyBalanceUseCase(repository);

    await expect(useCase.execute("01999999999")).rejects.toBeInstanceOf(
      LoyaltyAccountNotFoundError,
    );
  });
});
