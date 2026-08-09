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

const staffOrderInclude = {
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
      id: true,
      number: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      status: true,
      method: true,
      amount: true,
      paidAt: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type StaffOrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof staffOrderInclude;
}>;

export interface OrderQueuePageInput {
  statuses: OrderStatus[];
  page: number;
  limit: number;
}

export interface OrderQueuePageResult {
  items: OrderWithRelations[];
  total: number;
}

export interface OrderHistoryQueryInput {
  orderNumber?: number;
  status?: OrderStatus;
  createdAt?: { gte: Date; lt: Date };
  page: number;
  limit: number;
}

const orderHistoryInclude = {
  table: {
    select: {
      number: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      status: true,
      method: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderHistoryWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderHistoryInclude;
}>;

export interface OrderHistoryPageResult {
  items: OrderHistoryWithRelations[];
  total: number;
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
      const order = await tx.order.create({
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

      await tx.restaurantTable.update({
        where: { id: input.tableId },
        data: { status: TableStatus.OCCUPIED },
      });

      return order;
    });
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
    return this.client.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async findStaffDetailsById(
    id: string,
  ): Promise<StaffOrderWithRelations | null> {
    return this.client.order.findUnique({
      where: { id },
      include: staffOrderInclude,
    });
  }

  async findMany(): Promise<OrderWithRelations[]> {
    return this.client.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async findQueuePage(
    input: OrderQueuePageInput,
  ): Promise<OrderQueuePageResult> {
    const where: Prisma.OrderWhereInput = {
      status: { in: input.statuses },
    };

    const [items, total] = await this.client.$transaction([
      this.client.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "asc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.client.order.count({ where }),
    ]);

    return { items, total };
  }

  async findHistoryPage(
    input: OrderHistoryQueryInput,
  ): Promise<OrderHistoryPageResult> {
    const where: Prisma.OrderWhereInput = {
      ...(input.orderNumber !== undefined && {
        orderNumber: input.orderNumber,
      }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.createdAt !== undefined && { createdAt: input.createdAt }),
    };

    const [items, total] = await this.client.$transaction([
      this.client.order.findMany({
        where,
        include: orderHistoryInclude,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      this.client.order.count({ where }),
    ]);

    return { items, total };
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

  async cancelOrderAndReleaseTableIfUnoccupied(input: {
    orderId: string;
    cancelledReason: string | null;
  }): Promise<OrderWithRelations> {
    return this.client.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledReason: input.cancelledReason,
        },
        include: orderInclude,
      });

      await syncTableStatusAfterTerminalOrder(tx, order.tableId);

      return order;
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

      await syncTableStatusAfterTerminalOrder(tx, input.tableId);

      return order;
    });
  }
}

async function syncTableStatusAfterTerminalOrder(
  tx: Prisma.TransactionClient,
  tableId: string,
): Promise<void> {
  const activeOrdersCount = await tx.order.count({
    where: {
      tableId,
      status: {
        notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
      },
    },
  });

  await tx.restaurantTable.update({
    where: { id: tableId },
    data: {
      status:
        activeOrdersCount === 0
          ? TableStatus.AVAILABLE
          : TableStatus.OCCUPIED,
    },
  });
}
