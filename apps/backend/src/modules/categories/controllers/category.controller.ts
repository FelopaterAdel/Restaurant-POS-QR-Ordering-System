import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateCategoryUseCase } from "../use-cases/create-category.use-case.js";
import { DisableCategoryUseCase } from "../use-cases/disable-category.use-case.js";
import { GetCategoryUseCase } from "../use-cases/get-category.use-case.js";
import { ListCategoriesUseCase } from "../use-cases/list-categories.use-case.js";
import { UpdateCategoryUseCase } from "../use-cases/update-category.use-case.js";

const createCategoryUseCase = new CreateCategoryUseCase();
const listCategoriesUseCase = new ListCategoriesUseCase();
const getCategoryUseCase = new GetCategoryUseCase();
const updateCategoryUseCase = new UpdateCategoryUseCase();
const disableCategoryUseCase = new DisableCategoryUseCase();

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const category = await createCategoryUseCase.execute(req.body);
  sendSuccess(res, category, 201);
}

export async function listCategories(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const all = req.query.all === "true";
  const categories = await listCategoriesUseCase.execute(all);
  sendSuccess(res, categories);
}

export async function getCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const category = await getCategoryUseCase.execute(req.params.id);
  sendSuccess(res, category);
}

export async function updateCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const category = await updateCategoryUseCase.execute(
    req.params.id,
    req.body,
  );
  sendSuccess(res, category);
}

export async function disableCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const category = await disableCategoryUseCase.execute(req.params.id);
  sendSuccess(res, category);
}
