import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { ProductRecipeRepository } from "../repositories/product-recipe.repository.js";

export class GetProductRecipeUseCase {
  private readonly productRepository: ProductRepository;
  private readonly recipeRepository: ProductRecipeRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
    recipeRepository: ProductRecipeRepository = new ProductRecipeRepository(),
  ) {
    this.productRepository = productRepository;
    this.recipeRepository = recipeRepository;
  }

  async execute(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(
        AppErrorCode.PRODUCT_NOT_FOUND,
        "Product not found",
      );
    }
    return this.recipeRepository.getRecipe(productId);
  }
}
