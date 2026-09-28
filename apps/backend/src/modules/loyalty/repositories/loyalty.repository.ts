import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s-]+/g, "");
}

export class LoyaltyRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findAccountByPhone(phone: string) {
    return this.client.loyaltyAccount.findUnique({
      where: { phone: normalizePhone(phone) },
    });
  }

  async findEntryByOrderId(orderId: string) {
    return this.client.loyaltyPointEntry.findUnique({
      where: { orderId },
    });
  }

  async findEntriesByAccountId(accountId: string) {
    return this.client.loyaltyPointEntry.findMany({
      where: { accountId },
      orderBy: { earnedAt: "desc" },
    });
  }

  async awardForOrder(input: {
    phone: string;
    orderId: string;
    points: number;
    expiresAt: Date;
  }) {
    return this.client.$transaction(async (tx) => {
      const existing = await tx.loyaltyPointEntry.findUnique({
        where: { orderId: input.orderId },
      });
      if (existing) {
        return { entry: existing, created: false as const };
      }

      const account = await tx.loyaltyAccount.upsert({
        where: { phone: normalizePhone(input.phone) },
        update: {},
        create: { phone: normalizePhone(input.phone) },
      });

      const entry = await tx.loyaltyPointEntry.create({
        data: {
          accountId: account.id,
          points: input.points,
          orderId: input.orderId,
          expiresAt: input.expiresAt,
        },
      });

      return { account, entry, created: true as const };
    });
  }
}
