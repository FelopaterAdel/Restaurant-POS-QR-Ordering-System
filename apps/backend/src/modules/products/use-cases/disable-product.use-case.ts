import type { Product } from "@restaurant/database";
import { ProductRepository } from "../repositories/product.repository.js";
import { ProductNotFoundError } from "./get-product.use-case.js";

export class DisableProductUseCase {
  private readonly productRepository: ProductRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
  ) {
    this.productRepository = productRepository;
  }

  async execute(id: string): Promise<Product> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    if (existing.isDeleted) {
      return existing;
    }

    return this.productRepository.disable(id);
  }
}
