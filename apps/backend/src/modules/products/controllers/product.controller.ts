import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import {
  CategoryDisabledError,
  CategoryNotFoundError,
  CreateProductUseCase,
} from "../use-cases/create-product.use-case.js";
import { DisableProductUseCase } from "../use-cases/disable-product.use-case.js";
import {
  GetProductUseCase,
  ProductNotFoundError,
} from "../use-cases/get-product.use-case.js";
import { ListProductsUseCase } from "../use-cases/list-products.use-case.js";
import { UpdateProductUseCase } from "../use-cases/update-product.use-case.js";

const createProductUseCase = new CreateProductUseCase();
const listProductsUseCase = new ListProductsUseCase();
const getProductUseCase = new GetProductUseCase();
const updateProductUseCase = new UpdateProductUseCase();
const disableProductUseCase = new DisableProductUseCase();

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await createProductUseCase.execute(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof CategoryDisabledError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function listProducts(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const products = await listProductsUseCase.execute();

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await getProductUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function updateProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await updateProductUseCase.execute(
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof CategoryNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error instanceof CategoryDisabledError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}

export async function disableProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await disableProductUseCase.execute(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product disabled successfully",
      data: product,
    });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
}
