import type { Category } from "@restaurant/database";
import { CategoryRepository } from "../repositories/category.repository.js";

export class ListCategoriesUseCase {
  private readonly categoryRepository: CategoryRepository;

  constructor(
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.categoryRepository = categoryRepository;
  }

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findActive();
  }
}
