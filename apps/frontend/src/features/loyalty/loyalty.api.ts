import { api } from "@/lib/api";

export interface LoyaltyBalance {
  phone: string;
  balance: number;
  lifetimePoints: number;
  tier: "Bronze" | "Silver" | "Gold";
}

export async function getPublicLoyaltyBalance(
  phone: string,
): Promise<LoyaltyBalance> {
  return api.get<LoyaltyBalance>("/public/loyalty", {
    params: { phone },
    skipAuthRefresh: true,
  });
}
