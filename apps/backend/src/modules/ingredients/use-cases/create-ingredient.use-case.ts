import { Prisma } from "@restaurant/database";
import type { Ingredient } from "@restaurant/database";
import { ConflictError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import {
  createIngredientSchema,
  type CreateIngredientInput,
} from "../schemas/create-ingredient.schema.js";

export class IngredientNameAlreadyExistsError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.INGREDIENT_NAME_ALREADY_EXISTS,
      "An ingredient with this name already exists",
    );
    this.name = "IngredientNameAlreadyExistsError";
  }
}

export class CreateIngredientUseCase {
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
  }

  async execute(input: CreateIngredientInput): Promise<Ingredient> {
    const data = createIngredientSchema.parse(input);

    const existing = await this.ingredientRepository.findByName(data.name);
    if (existing) {
      throw new IngredientNameAlreadyExistsError();
    }

    try {
      return await this.ingredientRepository.create(data);
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
