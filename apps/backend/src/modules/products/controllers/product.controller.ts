import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CreateProductUseCase } from "../use-cases/create-product.use-case.js";
import { DisableProductUseCase } from "../use-cases/disable-product.use-case.js";
import { GetProductUseCase } from "../use-cases/get-product.use-case.js";
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
  const product = await createProductUseCase.execute(req.body);
  sendSuccess(res, product, 201);
}

export async function listProducts(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const products = await listProductsUseCase.execute();
  sendSuccess(res, products);
}

export async function getProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const product = await getProductUseCase.execute(req.params.id);
  sendSuccess(res, product);
}

export async function updateProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const product = await updateProductUseCase.execute(req.params.id, req.body);
  sendSuccess(res, product);
}

export async function disableProduct(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const product = await disableProductUseCase.execute(req.params.id);
  sendSuccess(res, product);
}
