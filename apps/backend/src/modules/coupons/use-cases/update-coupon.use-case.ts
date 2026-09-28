import { Prisma } from "@restaurant/database";
import type { Coupon } from "@restaurant/database";
import {
  normalizeCouponCode,
  CouponRepository,
} from "../repositories/coupon.repository.js";
import {
  updateCouponSchema,
  type UpdateCouponDTO,
} from "../schemas/update-coupon.schema.js";
import { CouponAlreadyExistsError } from "./create-coupon.use-case.js";
import { GetCouponUseCase } from "./get-coupon.use-case.js";

export class UpdateCouponUseCase {
  private readonly couponRepository: CouponRepository;
  private readonly getCouponUseCase: GetCouponUseCase;

  constructor(couponRepository: CouponRepository = new CouponRepository()) {
    this.couponRepository = couponRepository;
    this.getCouponUseCase = new GetCouponUseCase(couponRepository);
  }

  async execute(id: string, input: UpdateCouponDTO): Promise<Coupon> {
    const data = updateCouponSchema.parse(input);

    await this.getCouponUseCase.execute(id);

    const code = data.code ? normalizeCouponCode(data.code) : undefined;
    if (code) {
      const existing = await this.couponRepository.findByCode(code);
      if (existing && existing.id !== id) {
        throw new CouponAlreadyExistsError();
      }
    }

    try {
      return await this.couponRepository.update(id, { ...data, code });
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
