import { Prisma } from "@restaurant/database";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import { createNotificationForRoles } from "../../notifications/services/notification.service.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { ProductRecipeRepository } from "../repositories/product-recipe.repository.js";

export interface DeductedLine {
  ingredientId: string;
  name: string;
  unit: string;
  amount: number;
  before: number;
  after: number;
}

export interface LowStockLine {
  id: string;
  name: string;
  unit: string;
  quantityInStock: number;
  lowStockThreshold: number;
}

export interface DeductOrderStockResult {
  deducted: DeductedLine[];
  lowStock: LowStockLine[];
}

/**
 * Deducts the recipe ingredients of every item in an order from stock.
 *
 * All decrements run inside a single Prisma transaction so concurrent
 * PREPARING transitions stay atomic and never interleave into partial
 * states. Row-level `decrement` keeps each update race-safe.
 */
export class DeductOrderStockUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly recipeRepository: ProductRecipeRepository;
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    recipeRepository: ProductRecipeRepository = new ProductRecipeRepository(),
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.orderRepository = orderRepository;
    this.recipeRepository = recipeRepository;
    this.ingredientRepository = ingredientRepository;
  }

  async deductForOrder(orderId: string): Promise<DeductOrderStockResult> {
    const empty: DeductOrderStockResult = { deducted: [], lowStock: [] };

    const order = await this.orderRepository.findById(orderId);
    if (!order || order.items.length === 0) {
      return empty;
    }

    const totals = new Map<string, InstanceType<typeof Prisma.Decimal>>();
    for (const item of order.items) {
      const recipe = await this.recipeRepository.getRecipe(item.productId);
      for (const row of recipe) {
        const line = new Prisma.Decimal(row.quantityUsed.toString()).mul(
          item.quantity,
        );
        const current = totals.get(row.ingredientId);
        totals.set(
          row.ingredientId,
          current ? current.add(line) : line,
        );
      }
    }

    if (totals.size === 0) {
      return empty;
    }

    const ids = [...totals.keys()];
    const before = await Promise.all(
      ids.map((id) => this.ingredientRepository.findById(id)),
    );
    const beforeById = new Map(
      before.filter((row) => row !== null).map((row) => [row.id, row]),
    );

    const updated = await this.ingredientRepository.decrementMany(
      ids.map((id) => ({ id, amount: totals.get(id)!.toString() })),
    );
    const updatedById = new Map(updated.map((row) => [row.id, row]));

    const deducted: DeductedLine[] = [];
    const lowStock: LowStockLine[] = [];

    for (const id of ids) {
      const prev = beforeById.get(id);
      const next = updatedById.get(id);
      if (!prev || !next) {
        continue;
      }
      const beforeQty = Number(prev.quantityInStock);
      const afterQty = Number(next.quantityInStock);
      const threshold = Number(next.lowStockThreshold);
      deducted.push({
        ingredientId: id,
        name: next.name,
        unit: next.unit,
        amount: Number(totals.get(id)!.toString()),
        before: beforeQty,
        after: afterQty,
      });

      // Notify only on crossing the threshold, so every PREPARING
      // transition does not re-spam staff about the same ingredient.
      if (beforeQty > threshold && afterQty <= threshold) {
        lowStock.push({
          id: next.id,
          name: next.name,
          unit: next.unit,
          quantityInStock: afterQty,
          lowStockThreshold: threshold,
        });
        await createNotificationForRoles("LOW_STOCK", {
          title: `Low stock: ${next.name}`,
          message: `${next.name} is down to ${afterQty} ${next.unit} (threshold ${threshold} ${next.unit})`,
          entityType: "INGREDIENT",
          entityId: next.id,
        });
      }
    }

    return { deducted, lowStock };
  }
}
