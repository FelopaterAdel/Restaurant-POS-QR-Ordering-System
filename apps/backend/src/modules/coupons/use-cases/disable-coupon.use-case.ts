import type { Coupon } from "@restaurant/database";
import { CouponRepository } from "../repositories/coupon.repository.js";
import { GetCouponUseCase } from "./get-coupon.use-case.js";

export class DisableCouponUseCase {
  private readonly couponRepository: CouponRepository;
  private readonly getCouponUseCase: GetCouponUseCase;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
    this.getCouponUseCase = new GetCouponUseCase(couponRepository);
  }

  async execute(id: string): Promise<Coupon> {
    await this.getCouponUseCase.execute(id);
    return this.couponRepository.disable(id);
  }
}
