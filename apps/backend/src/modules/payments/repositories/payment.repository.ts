import { prisma, PaymentStatus } from "@restaurant/database";
import type {
  PaymentMethod,
  Prisma,
  PrismaClient,
} from "@restaurant/database";

export interface CreatePaidPaymentInput {
  orderId: string;
  amount: Prisma.Decimal;
  method: PaymentMethod;
  paidAt: Date;
}

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

  async createPaidPaymentAndUpdateOrder(input: CreatePaidPaymentInput) {
    return this.client.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId: input.orderId,
          amount: input.amount,
          method: input.method,
          status: PaymentStatus.PAID,
          paidAt: input.paidAt,
        },
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: { paymentStatus: PaymentStatus.PAID },
      });

      return payment;
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
