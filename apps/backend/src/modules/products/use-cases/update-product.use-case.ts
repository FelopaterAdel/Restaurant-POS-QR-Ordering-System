import type { Product } from "@restaurant/database";
import { CategoryRepository } from "../../categories/repositories/category.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  updateProductSchema,
  type UpdateProductDTO,
} from "../schemas/update-product.schema.js";
import {
  CategoryDisabledError,
  CategoryNotFoundError,
} from "./create-product.use-case.js";
import { ProductNotFoundError } from "./get-product.use-case.js";

export class UpdateProductUseCase {
  private readonly productRepository: ProductRepository;
  private readonly categoryRepository: CategoryRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(id: string, input: UpdateProductDTO): Promise<Product> {
    const data = updateProductSchema.parse(input);

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
      if (!category.isActive) {
        throw new CategoryDisabledError();
      }
    }

    return this.productRepository.update(id, data);
  }
}
