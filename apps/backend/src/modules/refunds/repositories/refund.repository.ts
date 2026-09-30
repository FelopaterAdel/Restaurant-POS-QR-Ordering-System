import { prisma, PaymentStatus, Prisma, RefundStatus } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateRefundInput {
  paymentId: string;
  orderId: string;
  amount: Prisma.Decimal;
  reason?: string | null;
  requestedBy: string;
}

const withRelations = {
  payment: {
    select: {
      id: true,
      orderId: true,
      amount: true,
      tipAmount: true,
      method: true,
      status: true,
    },
  },
  order: {
    select: { id: true, orderNumber: true, totalAmount: true },
  },
} as const;

export class RefundRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.refund.findUnique({
      where: { id },
      include: withRelations,
    });
  }

  async findPendingByPayment(paymentId: string) {
    return this.client.refund.findFirst({
      where: { paymentId, status: RefundStatus.PENDING },
    });
  }

  async findByStatus(status: RefundStatus) {
    return this.client.refund.findMany({
      where: { status },
      include: withRelations,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateRefundInput) {
    return this.client.refund.create({
      data: {
        paymentId: data.paymentId,
        orderId: data.orderId,
        amount: data.amount,
        reason: data.reason ?? null,
        requestedBy: data.requestedBy,
      },
      include: withRelations,
    });
  }

  /**
   * Approves a pending refund. A full refund voids the payment and reopens
   * the order when no other PAID payments cover the items total; a partial
   * refund is recorded financially and leaves payment state untouched.
   * Returns null when the refund was already reviewed concurrently.
   */
  async approve(
    id: string,
    reviewerId: string,
    voidPayment: boolean,
  ) {
    return this.client.$transaction(async (tx) => {
      const claimed = await tx.refund.updateMany({
        where: { id, status: RefundStatus.PENDING },
        data: {
          status: RefundStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        return null;
      }

      if (voidPayment) {
        const refund = await tx.refund.findUniqueOrThrow({ where: { id } });
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: PaymentStatus.VOIDED },
        });

        const paid = await tx.payment.findMany({
          where: { orderId: refund.orderId, status: PaymentStatus.PAID },
          select: { amount: true, tipAmount: true },
        });
        const paidItems = paid.reduce(
          (sum, row) => sum.add(row.amount.sub(row.tipAmount)),
          new Prisma.Decimal(0),
        );
        const order = await tx.order.findUniqueOrThrow({
          where: { id: refund.orderId },
        });
        await tx.order.update({
          where: { id: refund.orderId },
          data: {
            paymentStatus: paidItems.gte(new Prisma.Decimal(order.totalAmount))
              ? PaymentStatus.PAID
              : PaymentStatus.PENDING,
          },
        });
      }

      return tx.refund.findUniqueOrThrow({
        where: { id },
        include: withRelations,
      });
    });
  }

  async reject(id: string, reviewerId: string, reason?: string | null) {
    const claimed = await this.client.refund.updateMany({
      where: { id, status: RefundStatus.PENDING },
      data: {
        status: RefundStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(reason ? { reason } : {}),
      },
    });
    if (claimed.count === 0) {
      return null;
    }
    return this.client.refund.findUniqueOrThrow({
      where: { id },
      include: withRelations,
    });
  }
}
