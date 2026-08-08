import { OrderStatus, prisma, TableStatus } from "@restaurant/database";
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

const orderInclude = {
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
  table: {
    select: {
      number: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

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
        include: orderInclude,
      });
    });
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
    return this.client.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async findMany(): Promise<OrderWithRelations[]> {
    return this.client.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderWithRelations> {
    return this.client.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  }

  async completeOrderAndReleaseTable(input: {
    orderId: string;
    tableId: string;
  }): Promise<OrderWithRelations> {
    return this.client.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: input.orderId },
        data: { status: OrderStatus.COMPLETED },
        include: orderInclude,
      });

      await tx.restaurantTable.update({
        where: { id: input.tableId },
        data: { status: TableStatus.AVAILABLE },
      });

      return order;
    });
  }
}
