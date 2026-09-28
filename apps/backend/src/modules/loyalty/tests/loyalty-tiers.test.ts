import { describe, expect, it } from "vitest";
import {
  calculateEarnedPoints,
  getLoyaltyTier,
} from "../use-cases/loyalty-tiers.js";
import { env } from "../../../config/env.js";

describe("getLoyaltyTier", () => {
  it("returns Bronze below the silver threshold", () => {
    expect(getLoyaltyTier(0)).toBe("Bronze");
    expect(getLoyaltyTier(env.loyalty.silverThreshold - 1)).toBe("Bronze");
  });

  it("returns Silver between the thresholds", () => {
    expect(getLoyaltyTier(env.loyalty.silverThreshold)).toBe("Silver");
    expect(getLoyaltyTier(env.loyalty.goldThreshold - 1)).toBe("Silver");
  });

  it("returns Gold at and above the gold threshold", () => {
    expect(getLoyaltyTier(env.loyalty.goldThreshold)).toBe("Gold");
    expect(getLoyaltyTier(env.loyalty.goldThreshold + 10_000)).toBe("Gold");
  });
});

describe("calculateEarnedPoints", () => {
  it("floors the total by the configured amount per point", () => {
    const per = env.loyalty.amountPerPoint;
    expect(calculateEarnedPoints(per * 3)).toBe(3);
    expect(calculateEarnedPoints(per * 3 + per - 1)).toBe(3);
  });

  it("returns zero for zero or invalid totals", () => {
    expect(calculateEarnedPoints(0)).toBe(0);
    expect(calculateEarnedPoints(-50)).toBe(0);
    expect(calculateEarnedPoints("not-a-number")).toBe(0);
  });
});
