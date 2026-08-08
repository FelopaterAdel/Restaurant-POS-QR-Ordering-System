import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateCategoryUseCase } from "../use-cases/create-category.use-case.js";
import { CategoryNameAlreadyExistsError } from "../use-cases/create-category.use-case.js";
import { DisableCategoryUseCase } from "../use-cases/disable-category.use-case.js";
import { CategoryNotFoundError } from "../use-cases/get-category.use-case.js";
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
  try {
    const category = await createCategoryUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof CategoryNameAlreadyExistsError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function listCategories(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await listCategoriesUseCase.execute();

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const category = await getCategoryUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const category = await updateCategoryUseCase.execute(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof CategoryNameAlreadyExistsError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function disableCategory(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const category = await disableCategoryUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category disabled successfully",
      data: category,
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}
