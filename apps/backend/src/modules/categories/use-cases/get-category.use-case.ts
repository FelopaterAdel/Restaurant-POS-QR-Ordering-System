import type { Category } from "@restaurant/database";
import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { CategoryRepository } from "../repositories/category.repository.js";

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.CATEGORY_NOT_FOUND, "Category not found");
    this.name = "CategoryNotFoundError";
  }
}

export class GetCategoryUseCase {
  private readonly categoryRepository: CategoryRepository;

  constructor(
    categoryRepository: CategoryRepository = new CategoryRepository(),
  ) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new CategoryNotFoundError();
    }

    return category;
  }
}
