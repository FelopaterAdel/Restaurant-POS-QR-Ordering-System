export type CouponDiscountType = "PERCENT" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  value: number | string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  value: number;
  expiresAt?: string | null;
  maxUses?: number | null;
}

export interface UpdateCouponInput {
  code?: string;
  discountType?: CouponDiscountType;
  value?: number;
  expiresAt?: string | null;
  maxUses?: number | null;
  isActive?: boolean;
}
