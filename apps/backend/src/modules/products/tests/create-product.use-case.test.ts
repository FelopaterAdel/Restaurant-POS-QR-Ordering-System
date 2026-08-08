import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../../categories/repositories/category.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  CategoryDisabledError,
  CategoryNotFoundError,
  CreateProductUseCase,
} from "../use-cases/create-product.use-case.js";
import { buildProduct } from "./product.fixture.js";

function createMockProductRepository(
  overrides: Partial<ProductRepository> = {},
): ProductRepository {
  return {
    findById: vi.fn(),
    findAvailable: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as ProductRepository;
}

function createMockCategoryRepository(
  overrides: Partial<CategoryRepository> = {},
): CategoryRepository {
  return {
    findById: vi.fn(),
    findByName: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as CategoryRepository;
}

describe("CreateProductUseCase", () => {
  it("creates a product when the category exists and is active", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new CreateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const product = buildProduct();

    vi.mocked(categoryRepository.findById).mockResolvedValueOnce({
      id: "cat_1",
      name: "Pizza",
      description: null,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(productRepository.create).mockResolvedValueOnce(product);

    const result = await useCase.execute({
      name: "Margherita Pizza",
      categoryId: "cat_1",
      price: 150,
    });

    expect(productRepository.create).toHaveBeenCalledWith({
      name: "Margherita Pizza",
      categoryId: "cat_1",
      price: 150,
    });
    expect(result).toEqual(product);
  });

  it("throws CategoryNotFoundError when the category does not exist", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new CreateProductUseCase(
      productRepository,
      categoryRepository,
    );

    vi.mocked(categoryRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        name: "Margherita Pizza",
        categoryId: "cat_missing",
        price: 150,
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(productRepository.create).not.toHaveBeenCalled();
  });

  it("throws CategoryDisabledError when the category is disabled", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new CreateProductUseCase(
      productRepository,
      categoryRepository,
    );

    vi.mocked(categoryRepository.findById).mockResolvedValueOnce({
      id: "cat_1",
      name: "Desserts",
      description: null,
      isActive: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(
      useCase.execute({
        name: "Cake",
        categoryId: "cat_1",
        price: 200,
      }),
    ).rejects.toBeInstanceOf(CategoryDisabledError);
    expect(productRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive price", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new CreateProductUseCase(
      productRepository,
      categoryRepository,
    );

    vi.mocked(categoryRepository.findById).mockResolvedValueOnce({
      id: "cat_1",
      name: "Pizza",
      description: null,
      isActive: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await expect(
      useCase.execute({
        name: "Margherita Pizza",
        categoryId: "cat_1",
        price: 0,
      }),
    ).rejects.toThrow();

    await expect(
      useCase.execute({
        name: "Margherita Pizza",
        categoryId: "cat_1",
        price: -10,
      }),
    ).rejects.toThrow();

    expect(productRepository.create).not.toHaveBeenCalled();
  });
});
