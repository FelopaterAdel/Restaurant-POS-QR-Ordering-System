import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateProductInput {
  name: string;
  categoryId: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export class ProductRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.product.findUnique({
      where: { id, isDeleted: false },
    });
  }

  async findAvailable() {
    return this.client.product.findMany({
      where: { isAvailable: true, isDeleted: false },
      orderBy: { name: "asc" },
    });
  }

  async findAll() {
    return this.client.product.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
      include: { category: true },
    });
  }

  async create(data: CreateProductInput) {
    return this.client.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description ?? null,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
      },
    });
  }

  async update(id: string, data: UpdateProductInput) {
    return this.client.product.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable,
      },
    });
  }

  async disable(id: string) {
    return this.client.product.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
