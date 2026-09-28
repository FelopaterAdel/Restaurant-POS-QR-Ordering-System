import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateIngredientInput {
  name: string;
  unit: string;
  quantityInStock?: number | string;
  lowStockThreshold?: number | string;
}

export interface UpdateIngredientInput {
  name?: string;
  unit?: string;
  quantityInStock?: number | string;
  lowStockThreshold?: number | string;
  isActive?: boolean;
}

export class IngredientRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.ingredient.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.client.ingredient.findUnique({
      where: { name },
    });
  }

  async findAll() {
    return this.client.ingredient.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findActive() {
    return this.client.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async create(data: CreateIngredientInput) {
    return this.client.ingredient.create({
      data: {
        name: data.name,
        unit: data.unit,
        quantityInStock: data.quantityInStock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateIngredientInput) {
    return this.client.ingredient.update({
      where: { id },
      data: {
        name: data.name,
        unit: data.unit,
        quantityInStock: data.quantityInStock,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
      },
    });
  }

  async disable(id: string) {
    return this.client.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async decrementMany(
    entries: Array<{ id: string; amount: number | string }>,
  ) {
    return this.client.$transaction(
      entries.map((entry) =>
        this.client.ingredient.update({
          where: { id: entry.id },
          data: { quantityInStock: { decrement: entry.amount } },
        }),
      ),
    );
  }
}
