import { prisma } from "@restaurant/database";
import type { Prisma, PrismaClient } from "@restaurant/database";

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
}

export interface CreateOrderWithItemsInput {
  tableId: string;
  totalAmount: Prisma.Decimal;
  items: CreateOrderItemInput[];
}

export class OrderRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findTableById(id: string) {
    return this.client.restaurantTable.findUnique({
      where: { id },
    });
  }

  async findProductsByIds(ids: string[]) {
    return this.client.product.findMany({
      where: { id: { in: ids } },
    });
  }

  async createWithItems(input: CreateOrderWithItemsInput) {
    return this.client.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          tableId: input.tableId,
          totalAmount: input.totalAmount,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });
  }
}
