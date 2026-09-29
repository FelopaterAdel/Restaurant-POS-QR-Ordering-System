import { OrderStatus, PaymentStatus, prisma } from "@restaurant/database";
import type { Prisma, PrismaClient } from "@restaurant/database";

export interface DayRange {
  start: Date;
  end: Date;
}

export interface PaidPaymentRow {
  paidAt: Date;
  amount: Prisma.Decimal;
}

export interface DashboardSummaryResult {
  orderCountsByStatus: { status: OrderStatus; count: number }[];
  paidOrdersCount: number;
  totalSales: Prisma.Decimal | null;
  paidPayments: PaidPaymentRow[];
}

export interface TopProductRow {
  productId: string;
  quantity: number;
  revenue: Prisma.Decimal | null;
}

export class DashboardRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findSummary(range: DayRange): Promise<DashboardSummaryResult> {
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

    const paidPaymentsRaw = await this.client.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: range.start, lt: range.end },
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: "asc" },
    });

    const paidPayments: PaidPaymentRow[] = paidPaymentsRaw.filter(
      (row): row is PaidPaymentRow => row.paidAt !== null,
    );

    return {
      orderCountsByStatus: orderCountsByStatus.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),
      paidOrdersCount,
      totalSales: sales._sum.amount,
      paidPayments,
    };
  }

  async findTopProducts(
    range: DayRange,
    limit: number,
  ): Promise<TopProductRow[]> {
    const groups = await this.client.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          createdAt: { gte: range.start, lt: range.end },
          status: { not: OrderStatus.CANCELLED },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    return groups.map((group) => ({
      productId: group.productId,
      quantity: group._sum.quantity ?? 0,
      revenue: group._sum.totalPrice,
    }));
  }

  async findPaidPayments(range: DayRange): Promise<PaidPaymentRow[]> {
    const rows = await this.client.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: range.start, lt: range.end },
      },
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: "asc" },
    });

    return rows.filter(
      (row): row is PaidPaymentRow => row.paidAt !== null,
    );
  }
}
