import { prisma, type PrismaClient, type Restaurant } from "@restaurant/database";
import type { UpdateRestaurantInput } from "../schemas/update-restaurant.schema.js";

export type { Restaurant };

export class RestaurantRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async find() {
    return this.client.restaurant.findFirst();
  }

  async upsert(data: UpdateRestaurantInput) {
    const existing = await this.client.restaurant.findFirst();

    if (existing) {
      return this.client.restaurant.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.client.restaurant.create({
      data: {
        name: data.name ?? "My Restaurant",
        description: data.description ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor ?? "#059669",
        secondaryColor: data.secondaryColor ?? null,
      },
    });
  }
}
