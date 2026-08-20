import type { Product } from "@restaurant/database";
import { ProductRepository } from "../repositories/product.repository.js";

export class ListProductsUseCase {
  private readonly productRepository: ProductRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
  ) {
    this.productRepository = productRepository;
  }

  async execute(all = false): Promise<unknown[]> {
    if (all) {
      return this.productRepository.findAll();
    }
    return this.productRepository.findAvailable();
  }
}
