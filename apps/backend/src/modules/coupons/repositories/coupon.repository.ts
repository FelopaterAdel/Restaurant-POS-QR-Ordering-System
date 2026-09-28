import { prisma } from "@restaurant/database";
import type { CouponDiscountType, PrismaClient } from "@restaurant/database";

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  value: number | string;
  expiresAt?: Date | null;
  maxUses?: number | null;
}

export interface UpdateCouponInput {
  code?: string;
  discountType?: CouponDiscountType;
  value?: number | string;
  expiresAt?: Date | null;
  maxUses?: number | null;
  isActive?: boolean;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export class CouponRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.coupon.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.client.coupon.findUnique({
      where: { code: normalizeCouponCode(code) },
    });
  }

  async findAll() {
    return this.client.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findActive() {
    return this.client.coupon.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateCouponInput) {
    return this.client.coupon.create({
      data: {
        code: normalizeCouponCode(data.code),
        discountType: data.discountType,
        value: data.value,
        expiresAt: data.expiresAt ?? null,
        maxUses: data.maxUses ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCouponInput) {
    return this.client.coupon.update({
      where: { id },
      data: {
        code: data.code ? normalizeCouponCode(data.code) : undefined,
        discountType: data.discountType,
        value: data.value,
        expiresAt: data.expiresAt,
        maxUses: data.maxUses,
        isActive: data.isActive,
      },
    });
  }

  async disable(id: string) {
    return this.client.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
