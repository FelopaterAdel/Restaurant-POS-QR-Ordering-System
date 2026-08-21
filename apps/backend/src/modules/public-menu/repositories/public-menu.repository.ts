import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export class PublicMenuRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findTableByQrCode(qrCode: string) {
    return this.client.restaurantTable.findUnique({
      where: { qrCode },
    });
  }

  async findActiveCategoriesWithProducts() {
    return this.client.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isAvailable: true, isDeleted: false },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findRestaurant() {
    return this.client.restaurant.findFirst();
  }
}
