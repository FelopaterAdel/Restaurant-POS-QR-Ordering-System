import type { Product } from "@restaurant/database";
import { CategoryRepository } from "../../categories/repositories/category.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  createProductSchema,
  type CreateProductDTO,
} from "../schemas/create-product.schema.js";

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found");
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryDisabledError extends Error {
  constructor() {
    super("Category is disabled");
    this.name = "CategoryDisabledError";
  }
}

export class CreateProductUseCase {
  private readonly productRepository: ProductRepository;
  private readonly categoryRepository: CategoryRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute(input: CreateProductDTO): Promise<Product> {
    const data = createProductSchema.parse(input);

    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (!category.isActive) {
      throw new CategoryDisabledError();
    }

    return this.productRepository.create(data);
  }
}
