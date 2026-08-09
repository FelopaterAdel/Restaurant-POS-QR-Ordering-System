import { OrderStatus, prisma, TableStatus } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateTableInput {
  number: number;
  name: string;
  qrCode: string;
}

export interface UpdateTableInput {
  number?: number;
  name?: string;
}

export class TableRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.restaurantTable.findUnique({
      where: { id },
    });
  }

  async findByNumber(number: number) {
    return this.client.restaurantTable.findUnique({
      where: { number },
    });
  }

  async findAll() {
    return this.client.restaurantTable.findMany({
      orderBy: { number: "asc" },
    });
  }

  async create(data: CreateTableInput) {
    return this.client.restaurantTable.create({
      data: {
        number: data.number,
        name: data.name,
        qrCode: data.qrCode,
      },
    });
  }

  async update(id: string, data: UpdateTableInput) {
    return this.client.restaurantTable.update({
      where: { id },
      data: {
        number: data.number,
        name: data.name,
      },
    });
  }

  async disable(id: string) {
    return this.client.restaurantTable.update({
      where: { id },
      data: { status: TableStatus.DISABLED },
    });
  }

  async countActiveOrders(tableId: string): Promise<number> {
    return this.client.order.count({
      where: {
        tableId,
        status: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
        },
      },
    });
  }
}
