import type { Product } from "@restaurant/database";
import { ProductRepository } from "../repositories/product.repository.js";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

export class GetProductUseCase {
  private readonly productRepository: ProductRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
  ) {
    this.productRepository = productRepository;
  }

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new ProductNotFoundError();
    }

    return product;
  }
}
