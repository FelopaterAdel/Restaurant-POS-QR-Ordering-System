import type { Product } from "@restaurant/database";
import { ProductRepository } from "../repositories/product.repository.js";

export class ListProductsUseCase {
  private readonly productRepository: ProductRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
  ) {
    this.productRepository = productRepository;
  }

  async execute(): Promise<Product[]> {
    return this.productRepository.findAvailable();
  }
}
