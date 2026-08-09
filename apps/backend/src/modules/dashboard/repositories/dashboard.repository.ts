import { PaymentStatus, prisma } from "@restaurant/database";
import type {
  OrderStatus,
  Prisma,
  PrismaClient,
} from "@restaurant/database";

export interface DayRange {
  start: Date;
  end: Date;
}

export interface DashboardSummaryResult {
  orderCountsByStatus: { status: OrderStatus; count: number }[];
  paidOrdersCount: number;
  totalSales: Prisma.Decimal | null;
}

export class DashboardRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findTodaySummary(range: DayRange): Promise<DashboardSummaryResult> {
    const [orderCountsByStatus, paidOrdersCount, sales] =
      await this.client.$transaction([
        this.client.order.groupBy({
          by: ["status"],
          where: {
            createdAt: { gte: range.start, lt: range.end },
          },
          _count: { _all: true },
        }),
        this.client.order.count({
          where: {
            createdAt: { gte: range.start, lt: range.end },
            paymentStatus: PaymentStatus.PAID,
          },
        }),
        this.client.payment.aggregate({
          where: {
            status: PaymentStatus.PAID,
            paidAt: { gte: range.start, lt: range.end },
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      orderCountsByStatus: orderCountsByStatus.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),
      paidOrdersCount,
      totalSales: sales._sum.amount,
    };
  }
}
