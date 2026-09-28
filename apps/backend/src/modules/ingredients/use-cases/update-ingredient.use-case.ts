import { Prisma } from "@restaurant/database";
import type { Ingredient } from "@restaurant/database";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import {
  updateIngredientSchema,
  type UpdateIngredientDTO,
} from "../schemas/update-ingredient.schema.js";
import { GetIngredientUseCase } from "./get-ingredient.use-case.js";
import { IngredientNameAlreadyExistsError } from "./create-ingredient.use-case.js";

export class UpdateIngredientUseCase {
  private readonly ingredientRepository: IngredientRepository;
  private readonly getIngredientUseCase: GetIngredientUseCase;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
    this.getIngredientUseCase = new GetIngredientUseCase(ingredientRepository);
  }

  async execute(id: string, input: UpdateIngredientDTO): Promise<Ingredient> {
    const data = updateIngredientSchema.parse(input);

    await this.getIngredientUseCase.execute(id);

    if (data.name) {
      const existing = await this.ingredientRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new IngredientNameAlreadyExistsError();
      }
    }

    try {
      return await this.ingredientRepository.update(id, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new IngredientNameAlreadyExistsError();
      }
      throw error;
    }
  }
}
