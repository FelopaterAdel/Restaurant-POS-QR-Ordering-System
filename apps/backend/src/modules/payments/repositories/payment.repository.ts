import { prisma, PaymentStatus } from "@restaurant/database";
import type { PaymentMethod, Prisma, PrismaClient } from "@restaurant/database";

export interface CreatePaidPaymentInput {
  orderId: string;
  amount: Prisma.Decimal;
  method: PaymentMethod;
  paidAt: Date;
}

export class PaymentRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

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
}
