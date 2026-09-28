import { Prisma } from "@restaurant/database";
import type { Coupon } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import {
  normalizeCouponCode,
  CouponRepository,
} from "../repositories/coupon.repository.js";
import {
  createCouponSchema,
  type CreateCouponInput,
} from "../schemas/create-coupon.schema.js";

export class CouponAlreadyExistsError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.COUPON_ALREADY_EXISTS,
      "A coupon with this code already exists",
    );
    this.name = "CouponAlreadyExistsError";
  }
}

export class CreateCouponUseCase {
  private readonly couponRepository: CouponRepository;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
  }

  async execute(input: CreateCouponInput): Promise<Coupon> {
    const data = createCouponSchema.parse(input);
    const code = normalizeCouponCode(data.code);

    const existing = await this.couponRepository.findByCode(code);
    if (existing) {
      throw new CouponAlreadyExistsError();
    }

    try {
      return await this.couponRepository.create({ ...data, code });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CouponAlreadyExistsError();
      }
      throw error;
    }
  }
}
