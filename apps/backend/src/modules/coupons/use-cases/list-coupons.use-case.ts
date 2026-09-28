import type { Coupon } from "@restaurant/database";
import { CouponRepository } from "../repositories/coupon.repository.js";

export class ListCouponsUseCase {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async execute(activeOnly = false): Promise<Coupon[]> {
    if (activeOnly) {
      return this.couponRepository.findActive();
    }
    return this.couponRepository.findAll();
  }
}
