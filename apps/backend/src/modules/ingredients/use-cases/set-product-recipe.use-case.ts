import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { ProductRecipeRepository } from "../repositories/product-recipe.repository.js";
import {
  setRecipeSchema,
  type SetRecipeDTO,
} from "../schemas/set-recipe.schema.js";
import { IngredientNotFoundError } from "./get-ingredient.use-case.js";

export class SetProductRecipeUseCase {
  private readonly productRepository: ProductRepository;
  private readonly ingredientRepository: IngredientRepository;
  private readonly recipeRepository: ProductRecipeRepository;

  constructor(
    productRepository: ProductRepository = new ProductRepository(),
    ingredientRepository: IngredientRepository = new IngredientRepository(),
    recipeRepository: ProductRecipeRepository = new ProductRecipeRepository(),
  ) {
    this.productRepository = productRepository;
    this.ingredientRepository = ingredientRepository;
    this.recipeRepository = recipeRepository;
  }

  async execute(productId: string, input: SetRecipeDTO) {
    const data = setRecipeSchema.parse(input);

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(
        AppErrorCode.PRODUCT_NOT_FOUND,
        "Product not found",
      );
    }

    const seen = new Set<string>();
    for (const item of data.items) {
      if (seen.has(item.ingredientId)) {
        throw new NotFoundError(
          AppErrorCode.INGREDIENT_NOT_FOUND,
          `Duplicate ingredient ${item.ingredientId} in recipe`,
        );
      }
      seen.add(item.ingredientId);
      const ingredient = await this.ingredientRepository.findById(
        item.ingredientId,
      );
      if (!ingredient) {
        throw new IngredientNotFoundError();
      }
    }

    return this.recipeRepository.setRecipe(productId, data.items);
  }
}
