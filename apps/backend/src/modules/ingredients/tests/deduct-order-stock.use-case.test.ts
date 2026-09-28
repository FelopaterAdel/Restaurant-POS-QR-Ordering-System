import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { ProductRecipeRepository } from "../repositories/product-recipe.repository.js";
import { DeductOrderStockUseCase } from "../use-cases/deduct-order-stock.use-case.js";
import { buildIngredient } from "./ingredient.fixture.js";

const { mockCreateNotificationForRoles } = vi.hoisted(() => ({
  mockCreateNotificationForRoles: vi.fn(async () => undefined),
}));

vi.mock("../../notifications/services/notification.service.js", () => ({
  createNotificationForRoles: mockCreateNotificationForRoles,
}));

function setup() {
  const orderRepository = {
    findById: vi.fn(),
  } as unknown as OrderRepository;
  const recipeRepository = {
    getRecipe: vi.fn(),
    setRecipe: vi.fn(),
  } as unknown as ProductRecipeRepository;
  const ingredientRepository = {
    findById: vi.fn(),
    decrementMany: vi.fn(),
  } as unknown as IngredientRepository;
  const useCase = new DeductOrderStockUseCase(
    orderRepository,
    recipeRepository,
    ingredientRepository,
  );
  return { orderRepository, recipeRepository, ingredientRepository, useCase };
}

function recipeRow(ingredientId: string, quantityUsed: number) {
  return {
    id: `ri_${ingredientId}`,
    productId: "prod_1",
    ingredientId,
    quantityUsed: new Prisma.Decimal(quantityUsed),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ingredient: buildIngredient({ id: ingredientId }),
  };
}

describe("DeductOrderStockUseCase", () => {
  it("deducts recipe quantities scaled by ordered quantity in one batch", async () => {
    const { orderRepository, recipeRepository, ingredientRepository, useCase } =
      setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce({
      id: "order_1",
      items: [{ productId: "prod_1", quantity: 2 }],
    } as never);
    vi.mocked(recipeRepository.getRecipe).mockResolvedValueOnce([
      recipeRow("ing_1", 1.5),
      recipeRow("ing_2", 2),
    ] as never);
    vi.mocked(ingredientRepository.findById).mockImplementation(
      async (id: string) =>
        buildIngredient({
          id,
          quantityInStock: "100" as never,
          lowStockThreshold: "10" as never,
        }) as never,
    );
    vi.mocked(ingredientRepository.decrementMany).mockImplementation(
      async (entries) =>
        entries.map((entry) =>
          buildIngredient({
            id: entry.id,
            quantityInStock: "90" as never,
            lowStockThreshold: "10" as never,
          }),
        ) as never,
    );

    const result = await useCase.deductForOrder("order_1");

    expect(ingredientRepository.decrementMany).toHaveBeenCalledTimes(1);
    expect(ingredientRepository.decrementMany).toHaveBeenCalledWith([
      { id: "ing_1", amount: "3" },
      { id: "ing_2", amount: "4" },
    ]);
    expect(result.deducted).toHaveLength(2);
    expect(result.lowStock).toHaveLength(0);
    expect(mockCreateNotificationForRoles).not.toHaveBeenCalled();
  });

  it("notifies only ingredients crossing the low-stock threshold", async () => {
    const { orderRepository, recipeRepository, ingredientRepository, useCase } =
      setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce({
      id: "order_1",
      items: [{ productId: "prod_1", quantity: 1 }],
    } as never);
    vi.mocked(recipeRepository.getRecipe).mockResolvedValueOnce([
      recipeRow("ing_low", 6),
      recipeRow("ing_already_low", 1),
    ] as never);
    vi.mocked(ingredientRepository.findById).mockImplementation(
      async (id: string) =>
        buildIngredient({
          id,
          quantityInStock: id === "ing_low" ? ("15" as never) : ("5" as never),
          lowStockThreshold: "10" as never,
        }) as never,
    );
    vi.mocked(ingredientRepository.decrementMany).mockImplementation(
      async (entries) =>
        entries.map((entry) =>
          buildIngredient({
            id: entry.id,
            quantityInStock:
              entry.id === "ing_low" ? ("9" as never) : ("4" as never),
            lowStockThreshold: "10" as never,
          }),
        ) as never,
    );

    const result = await useCase.deductForOrder("order_1");

    expect(result.lowStock).toHaveLength(1);
    expect(result.lowStock[0].id).toBe("ing_low");
    expect(mockCreateNotificationForRoles).toHaveBeenCalledTimes(1);
    expect(mockCreateNotificationForRoles).toHaveBeenCalledWith(
      "LOW_STOCK",
      expect.objectContaining({ entityId: "ing_low" }),
    );
  });

  it("does nothing for orders without items or recipes", async () => {
    const { orderRepository, recipeRepository, ingredientRepository, useCase } =
      setup();

    vi.mocked(orderRepository.findById).mockResolvedValueOnce({
      id: "order_1",
      items: [{ productId: "prod_1", quantity: 1 }],
    } as never);
    vi.mocked(recipeRepository.getRecipe).mockResolvedValueOnce([]);

    const result = await useCase.deductForOrder("order_1");

    expect(result).toEqual({ deducted: [], lowStock: [] });
    expect(ingredientRepository.decrementMany).not.toHaveBeenCalled();
  });
});
