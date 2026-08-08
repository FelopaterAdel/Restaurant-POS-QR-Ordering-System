import { Prisma } from "@restaurant/database";
import type { Category } from "@restaurant/database";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  createCategorySchema,
  type CreateCategoryDTO,
} from "../schemas/create-category.schema.js";

export class CategoryNameAlreadyExistsError extends Error {
  constructor() {
    super("A category with this name already exists");
    this.name = "CategoryNameAlreadyExistsError";
  }
}

export class CreateCategoryUseCase {
  private readonly categoryRepository: CategoryRepository;

  constructor(
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.categoryRepository = categoryRepository;
  }

  async execute(input: CreateCategoryDTO): Promise<Category> {
    const data = createCategorySchema.parse(input);

    const existing = await this.categoryRepository.findByName(data.name);
    if (existing) {
      throw new CategoryNameAlreadyExistsError();
    }

    try {
      return await this.categoryRepository.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CategoryNameAlreadyExistsError();
      }
      throw error;
    }
  }
}
