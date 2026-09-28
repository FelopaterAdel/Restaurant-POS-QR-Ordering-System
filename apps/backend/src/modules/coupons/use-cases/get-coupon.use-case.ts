import type { Coupon } from "@restaurant/database";
import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { CouponRepository } from "../repositories/coupon.repository.js";

export class CouponNotFoundByIdError extends NotFoundError {
  constructor() {
    super(AppErrorCode.COUPON_NOT_FOUND, "Coupon not found");
    this.name = "CouponNotFoundByIdError";
  }
}

export class GetCouponUseCase {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async execute(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new CouponNotFoundByIdError();
    }
    return coupon;
  }
}
