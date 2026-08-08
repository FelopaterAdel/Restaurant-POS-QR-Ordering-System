import type { Category } from "@restaurant/database";
import { CategoryRepository } from "../repositories/category.repository.js";
import { CategoryNotFoundError } from "./get-category.use-case.js";

export class DisableCategoryUseCase {
  private readonly categoryRepository: CategoryRepository;

  constructor(
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id: string): Promise<Category> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    if (!existing.isActive) {
      return existing;
    }

    return this.categoryRepository.disable(id);
  }
}
