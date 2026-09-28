import { env } from "../../../config/env.js";

export type LoyaltyTier = "Bronze" | "Silver" | "Gold";

/** Lifetime-points tier. Thresholds come from env with sane defaults. */
export function getLoyaltyTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= env.loyalty.goldThreshold) {
    return "Gold";
  }
  if (lifetimePoints >= env.loyalty.silverThreshold) {
    return "Silver";
  }
  return "Bronze";
}

/** Whole points earned for an order total (floored, never negative). */
export function calculateEarnedPoints(
  totalAmount: number | string,
): number {
  const total = Number(totalAmount);
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.floor(total / env.loyalty.amountPerPoint);
}

export function pointExpiryDate(from: Date = new Date()): Date {
  const expires = new Date(from);
  expires.setMonth(expires.getMonth() + env.loyalty.expiryMonths);
  return expires;
}
