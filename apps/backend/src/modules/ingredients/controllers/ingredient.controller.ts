import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateIngredientUseCase } from "../use-cases/create-ingredient.use-case.js";
import { DisableIngredientUseCase } from "../use-cases/disable-ingredient.use-case.js";
import { GetIngredientUseCase } from "../use-cases/get-ingredient.use-case.js";
import { ListIngredientsUseCase } from "../use-cases/list-ingredients.use-case.js";
import { ListLowStockUseCase } from "../use-cases/list-low-stock.use-case.js";
import { UpdateIngredientUseCase } from "../use-cases/update-ingredient.use-case.js";
import { GetProductRecipeUseCase } from "../use-cases/get-product-recipe.use-case.js";
import { SetProductRecipeUseCase } from "../use-cases/set-product-recipe.use-case.js";

const createIngredientUseCase = new CreateIngredientUseCase();
const listIngredientsUseCase = new ListIngredientsUseCase();
const getIngredientUseCase = new GetIngredientUseCase();
const updateIngredientUseCase = new UpdateIngredientUseCase();
const disableIngredientUseCase = new DisableIngredientUseCase();
const getProductRecipeUseCase = new GetProductRecipeUseCase();
const setProductRecipeUseCase = new SetProductRecipeUseCase();
const listLowStockUseCase = new ListLowStockUseCase();

export async function createIngredient(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const ingredient = await createIngredientUseCase.execute(req.body);
  sendSuccess(res, ingredient, 201);
}

export async function listIngredients(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const activeOnly = req.query.all !== "true";
  const ingredients = await listIngredientsUseCase.execute(activeOnly);
  sendSuccess(res, ingredients);
}

export async function getIngredient(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const ingredient = await getIngredientUseCase.execute(req.params.id);
  sendSuccess(res, ingredient);
}

export async function updateIngredient(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const ingredient = await updateIngredientUseCase.execute(
    req.params.id,
    req.body,
    req.user.id,
  );
  sendSuccess(res, ingredient);
}

export async function disableIngredient(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const ingredient = await disableIngredientUseCase.execute(req.params.id);
  sendSuccess(res, ingredient);
}

export async function listLowStockIngredients(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const ingredients = await listLowStockUseCase.execute();
  sendSuccess(res, ingredients);
}

export async function getProductRecipe(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const recipe = await getProductRecipeUseCase.execute(req.params.id);
  sendSuccess(res, recipe);
}

export async function setProductRecipe(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const recipe = await setProductRecipeUseCase.execute(
    req.params.id,
    req.body,
  );
  sendSuccess(res, recipe);
}
