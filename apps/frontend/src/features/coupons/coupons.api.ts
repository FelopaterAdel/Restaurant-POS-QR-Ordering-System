import { api } from "@/lib/api";
import type {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
} from "./coupons.types";

export async function listCoupons(): Promise<Coupon[]> {
  return api.get<Coupon[]>("/coupons?all=true");
}

export async function getCoupon(couponId: string): Promise<Coupon> {
  return api.get<Coupon>(`/coupons/${couponId}`);
}

export async function createCoupon(
  input: CreateCouponInput,
): Promise<Coupon> {
  return api.post<Coupon>("/coupons", input);
}

export async function updateCoupon(
  couponId: string,
  input: UpdateCouponInput,
): Promise<Coupon> {
  return api.patch<Coupon>(`/coupons/${couponId}`, input);
}

export async function disableCoupon(couponId: string): Promise<Coupon> {
  return api.delete<Coupon>(`/coupons/${couponId}`);
}
