import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface RecipeItemInput {
  ingredientId: string;
  quantityUsed: number | string;
}

export class ProductRecipeRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getRecipe(productId: string) {
    return this.client.productIngredient.findMany({
      where: { productId },
      include: { ingredient: true },
      orderBy: { ingredient: { name: "asc" } },
    });
  }

  async setRecipe(productId: string, items: RecipeItemInput[]) {
    return this.client.$transaction(async (tx) => {
      await tx.productIngredient.deleteMany({
        where: { productId },
      });

      if (items.length === 0) {
        return [];
      }

      await tx.productIngredient.createMany({
        data: items.map((item) => ({
          productId,
          ingredientId: item.ingredientId,
          quantityUsed: item.quantityUsed,
        })),
      });

      return tx.productIngredient.findMany({
        where: { productId },
        include: { ingredient: true },
        orderBy: { ingredient: { name: "asc" } },
      });
    });
  }
}
