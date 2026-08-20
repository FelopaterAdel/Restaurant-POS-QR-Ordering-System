import type { NextFunction, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import {
  GetRestaurantUseCase,
  UpdateRestaurantUseCase,
} from "../use-cases/restaurant.use-case.js";

const getRestaurantUseCase = new GetRestaurantUseCase();
const updateRestaurantUseCase = new UpdateRestaurantUseCase();

export async function getRestaurant(
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) {
  const restaurant = await getRestaurantUseCase.execute();
  sendSuccess(res, restaurant);
}

export async function updateRestaurant(
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
) {
  const restaurant = await updateRestaurantUseCase.execute(req.body);
  sendSuccess(res, restaurant);
}
