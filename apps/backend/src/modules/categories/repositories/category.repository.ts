import { prisma } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export class CategoryRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.category.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.client.category.findUnique({
      where: { name },
    });
  }

  async findActive() {
    return this.client.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async findAll() {
    return this.client.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  async create(data: CreateCategoryInput) {
    return this.client.category.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCategoryInput) {
    return this.client.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
    });
  }

  async disable(id: string) {
    return this.client.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
