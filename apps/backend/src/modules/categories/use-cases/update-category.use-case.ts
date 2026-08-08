import { Prisma } from "@restaurant/database";
import type { Category } from "@restaurant/database";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  updateCategorySchema,
  type UpdateCategoryDTO,
} from "../schemas/update-category.schema.js";
import { CategoryNameAlreadyExistsError } from "./create-category.use-case.js";
import { CategoryNotFoundError } from "./get-category.use-case.js";

export class UpdateCategoryUseCase {
  private readonly categoryRepository: CategoryRepository;

  constructor(
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id: string, input: UpdateCategoryDTO): Promise<Category> {
    const data = updateCategorySchema.parse(input);

    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.categoryRepository.findByName(data.name);
      if (duplicate) {
        throw new CategoryNameAlreadyExistsError();
      }
    }

    try {
      return await this.categoryRepository.update(id, data);
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
