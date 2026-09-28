import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateCouponUseCase } from "../use-cases/create-coupon.use-case.js";
import { DisableCouponUseCase } from "../use-cases/disable-coupon.use-case.js";
import { GetCouponUseCase } from "../use-cases/get-coupon.use-case.js";
import { ListCouponsUseCase } from "../use-cases/list-coupons.use-case.js";
import { UpdateCouponUseCase } from "../use-cases/update-coupon.use-case.js";
import { ValidateCouponUseCase } from "../use-cases/validate-coupon.use-case.js";

const createCouponUseCase = new CreateCouponUseCase();
const listCouponsUseCase = new ListCouponsUseCase();
const getCouponUseCase = new GetCouponUseCase();
const updateCouponUseCase = new UpdateCouponUseCase();
const disableCouponUseCase = new DisableCouponUseCase();
const validateCouponUseCase = new ValidateCouponUseCase();

export async function createCoupon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const coupon = await createCouponUseCase.execute(req.body);
  sendSuccess(res, coupon, 201);
}

export async function listCoupons(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const activeOnly = req.query.all !== "true";
  const coupons = await listCouponsUseCase.execute(activeOnly);
  sendSuccess(res, coupons);
}

export async function getCoupon(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const coupon = await getCouponUseCase.execute(req.params.id);
  sendSuccess(res, coupon);
}

export async function updateCoupon(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const coupon = await updateCouponUseCase.execute(req.params.id, req.body);
  sendSuccess(res, coupon);
}

export async function disableCoupon(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const coupon = await disableCouponUseCase.execute(req.params.id);
  sendSuccess(res, coupon);
}

export async function validateCoupon(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const code = req.query.code as string;
  const coupon = await validateCouponUseCase.execute(code);
  sendSuccess(res, coupon);
}
