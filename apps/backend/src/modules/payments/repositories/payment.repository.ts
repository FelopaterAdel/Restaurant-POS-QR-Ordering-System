import { prisma, PaymentStatus, Prisma } from "@restaurant/database";
import type { PaymentMethod, PrismaClient } from "@restaurant/database";

export interface CollectPaymentInput {
  orderId: string;
  /** Portion of the items total covered by this payment. */
  itemsAmount: Prisma.Decimal;
  tipAmount: Prisma.Decimal;
  method: PaymentMethod;
  paidAt: Date;
}

export interface CollectedPayment {
  payment: {
    id: string;
    orderId: string;
    amount: Prisma.Decimal;
    tipAmount: Prisma.Decimal;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: Date | null;
    createdAt: Date;
  };
  /** Items total still unpaid after this payment. */
  remaining: Prisma.Decimal;
  orderPaid: boolean;
}

export type CollectPaymentResult =
  | { ok: true; collected: CollectedPayment }
  | {
      ok: false;
      reason: "already-paid" | "exceeds-remaining" | "order-missing";
      remaining: Prisma.Decimal;
    };

export interface CreatePendingOnlinePaymentInput {
  orderId: string;
  amount: Prisma.Decimal;
  provider: string;
  providerRef: string;
}

export interface PaidPaymentWithOrder {
  id: string;
  orderId: string;
  amount: Prisma.Decimal;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  order: {
    orderNumber: number;
    table: {
      number: number;
    };
  };
}

export interface PaidPaymentsFilter {
  paidAt?: { gte: Date; lt: Date };
  orderNumber?: number;
}

export interface FindPaidPaymentsInput extends PaidPaymentsFilter {
  page: number;
  limit: number;
}

export interface PaidPaymentsPage {
  items: PaidPaymentWithOrder[];
  total: number;
}

export interface PaidPaymentsSummary {
  totalSales: Prisma.Decimal | null;
  count: number;
}

export class PaymentRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async createPendingOnlinePayment(input: CreatePendingOnlinePaymentInput) {
    return this.client.payment.create({
      data: {
        orderId: input.orderId,
        amount: input.amount,
        method: "CARD",
        status: PaymentStatus.PENDING,
        provider: input.provider,
        providerRef: input.providerRef,
      },
    });
  }

  async findById(id: string) {
    return this.client.payment.findUnique({
      where: { id },
    });
  }

  async findByProviderRef(providerRef: string) {
    return this.client.payment.findUnique({
      where: { providerRef },
    });
  }

  async confirmOnlinePayment(paymentId: string, orderId: string) {
    return this.client.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      return payment;
    });
  }

  /**
   * Records one (possibly partial) PAID payment with an optional tip.
   * The order row is locked first so concurrent payments serialize and the
   * items balance can never be over-collected.
   */
  async collectPayment(input: CollectPaymentInput): Promise<CollectPaymentResult> {
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${input.orderId} FOR UPDATE`;

      const order = await tx.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) {
        return {
          ok: false as const,
          reason: "order-missing" as const,
          remaining: new Prisma.Decimal(0),
        };
      }

      const paid = await tx.payment.findMany({
        where: { orderId: input.orderId, status: PaymentStatus.PAID },
        select: { amount: true, tipAmount: true },
      });
      const paidItems = paid.reduce(
        (sum, row) => sum.add(row.amount.sub(row.tipAmount)),
        new Prisma.Decimal(0),
      );
      const remaining = new Prisma.Decimal(order.totalAmount).sub(paidItems);

      if (remaining.lte(0)) {
        return {
          ok: false as const,
          reason: "already-paid" as const,
          remaining: new Prisma.Decimal(0),
        };
      }
      if (input.itemsAmount.gt(remaining)) {
        return {
          ok: false as const,
          reason: "exceeds-remaining" as const,
          remaining,
        };
      }

      const payment = await tx.payment.create({
        data: {
          orderId: input.orderId,
          amount: input.itemsAmount.add(input.tipAmount),
          tipAmount: input.tipAmount,
          method: input.method,
          status: PaymentStatus.PAID,
          paidAt: input.paidAt,
        },
      });

      const covered = input.itemsAmount.gte(remaining);
      await tx.order.update({
        where: { id: input.orderId },
        data: {
          tipAmount: { increment: input.tipAmount },
          paymentStatus: covered ? PaymentStatus.PAID : PaymentStatus.PENDING,
        },
      });

      return {
        ok: true as const,
        collected: {
          payment,
          remaining: remaining.sub(input.itemsAmount),
          orderPaid: covered,
        },
      };
    });
  }

  private paidPaymentsWhere(filter: PaidPaymentsFilter): Prisma.PaymentWhereInput {
    return {
      status: PaymentStatus.PAID,
      ...(filter.paidAt ? { paidAt: filter.paidAt } : {}),
      ...(filter.orderNumber !== undefined
        ? { order: { orderNumber: filter.orderNumber } }
        : {}),
    };
  }

  async findPaidPage(input: FindPaidPaymentsInput): Promise<PaidPaymentsPage> {
    const where = this.paidPaymentsWhere(input);

    const [items, total] = await this.client.$transaction([
      this.client.payment.findMany({
        where,
        orderBy: [{ paidAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              table: { select: { number: true } },
            },
          },
        },
      }),
      this.client.payment.count({ where }),
    ]);

    return { items, total };
  }

  async summarizePaidPayments(
    filter: PaidPaymentsFilter,
  ): Promise<PaidPaymentsSummary> {
    const where = this.paidPaymentsWhere(filter);

    const [aggregate, count] = await this.client.$transaction([
      this.client.payment.aggregate({ where, _sum: { amount: true } }),
      this.client.payment.count({ where }),
    ]);

    return { totalSales: aggregate._sum.amount, count };
  }
}
