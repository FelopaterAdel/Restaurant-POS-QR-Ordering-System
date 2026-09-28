import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import {
  normalizePhone,
  LoyaltyRepository,
} from "../repositories/loyalty.repository.js";
import { getLoyaltyTier, type LoyaltyTier } from "./loyalty-tiers.js";

export interface LoyaltyBalanceDTO {
  phone: string;
  balance: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
}

export function toLoyaltyBalanceDTO(
  phone: string,
  entries: Array<{ points: number; expiresAt: Date }>,
  now: Date = new Date(),
): LoyaltyBalanceDTO {
  const balance = entries
    .filter((entry) => entry.expiresAt > now)
    .reduce((sum, entry) => sum + entry.points, 0);
  const lifetimePoints = entries.reduce(
    (sum, entry) => sum + entry.points,
    0,
  );
  return { phone, balance, lifetimePoints, tier: getLoyaltyTier(lifetimePoints) };
}

export class LoyaltyAccountNotFoundError extends NotFoundError {
  constructor() {
    super(
      AppErrorCode.LOYALTY_ACCOUNT_NOT_FOUND,
      "No loyalty account found for this phone number yet",
    );
    this.name = "LoyaltyAccountNotFoundError";
  }
}

export class GetLoyaltyBalanceUseCase {
  private readonly loyaltyRepository: LoyaltyRepository;

  constructor(loyaltyRepository: LoyaltyRepository = new LoyaltyRepository()) {
    this.loyaltyRepository = loyaltyRepository;
  }

  async execute(phone: string): Promise<LoyaltyBalanceDTO> {
    const normalized = normalizePhone(phone);
    const account =
      await this.loyaltyRepository.findAccountByPhone(normalized);
    if (!account) {
      throw new LoyaltyAccountNotFoundError();
    }

    const entries = await this.loyaltyRepository.findEntriesByAccountId(
      account.id,
    );

    return toLoyaltyBalanceDTO(account.phone, entries);
  }
}
