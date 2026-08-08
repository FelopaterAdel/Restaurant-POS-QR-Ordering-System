import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../../categories/repositories/category.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  CategoryDisabledError,
  CategoryNotFoundError,
} from "../use-cases/create-product.use-case.js";
import { ProductNotFoundError } from "../use-cases/get-product.use-case.js";
import { UpdateProductUseCase } from "../use-cases/update-product.use-case.js";
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

function activeCategory() {
  return {
    id: "cat_2",
    name: "Drinks",
    description: null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("UpdateProductUseCase", () => {
  it("updates a product", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const existing = buildProduct({ id: "prod_1", name: "Margherita Pizza" });
    const updated = buildProduct({ id: "prod_1", name: "Margherita Classic" });

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(productRepository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("prod_1", { name: "Margherita Classic" });

    expect(productRepository.update).toHaveBeenCalledWith("prod_1", {
      name: "Margherita Classic",
    });
    expect(result).toEqual(updated);
  });

  it("throws ProductNotFoundError when the product does not exist", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );

    vi.mocked(productRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("prod_missing", { name: "Cola" }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it("throws CategoryNotFoundError when moving to a missing category", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const existing = buildProduct({ id: "prod_1", categoryId: "cat_1" });

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(categoryRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("prod_1", { categoryId: "cat_missing" }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it("throws CategoryDisabledError when moving to a disabled category", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const existing = buildProduct({ id: "prod_1", categoryId: "cat_1" });

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(categoryRepository.findById).mockResolvedValueOnce({
      ...activeCategory(),
      isActive: false,
    });

    await expect(
      useCase.execute("prod_1", { categoryId: "cat_2" }),
    ).rejects.toBeInstanceOf(CategoryDisabledError);
    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it("does not re-validate the category when keeping the same categoryId", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const existing = buildProduct({ id: "prod_1", categoryId: "cat_1" });
    const updated = buildProduct({
      id: "prod_1",
      categoryId: "cat_1",
      price: new Prisma.Decimal(180),
    });

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existing);
    vi.mocked(productRepository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("prod_1", { price: 180 });

    expect(categoryRepository.findById).not.toHaveBeenCalled();
    expect(productRepository.update).toHaveBeenCalledWith("prod_1", {
      price: 180,
    });
    expect(result).toEqual(updated);
  });

  it("returns the product unchanged when nothing is provided", async () => {
    const productRepository = createMockProductRepository();
    const categoryRepository = createMockCategoryRepository();
    const useCase = new UpdateProductUseCase(
      productRepository,
      categoryRepository,
    );
    const existing = buildProduct({ id: "prod_1" });

    vi.mocked(productRepository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("prod_1", {});

    expect(productRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
