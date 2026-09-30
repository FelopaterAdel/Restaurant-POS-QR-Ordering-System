import { PaymentStatus, Prisma } from "@restaurant/database";
import { AuditAction } from "@restaurant/database";
import { AuditService } from "../../audit/services/audit.service.js";
import { PaymentRepository } from "../../payments/repositories/payment.repository.js";
import { RefundRepository } from "../repositories/refund.repository.js";
import {
  requestRefundSchema,
  type RequestRefundInput,
} from "../schemas/request-refund.schema.js";
import {
  RefundAlreadyPendingError,
  RefundInvalidAmountError,
  RefundPaymentMissingError,
  RefundPaymentNotPaidError,
} from "./refund-errors.js";

export interface RequestRefundParams {
  input: RequestRefundInput;
  requestedBy: string;
}

export class RequestRefundUseCase {
  private readonly refundRepository: RefundRepository;
  private readonly paymentRepository: PaymentRepository;
  private readonly auditService: AuditService;

  constructor(
    refundRepository: RefundRepository = new RefundRepository(),
    paymentRepository: PaymentRepository = new PaymentRepository(),
    auditService: AuditService = new AuditService(),
  ) {
    this.refundRepository = refundRepository;
    this.paymentRepository = paymentRepository;
    this.auditService = auditService;
  }

  async execute(params: RequestRefundParams) {
    const data = requestRefundSchema.parse(params.input);

    const found = await this.paymentRepository.findById(data.paymentId);
    if (!found) {
      throw new RefundPaymentMissingError();
    }
    if (found.status !== PaymentStatus.PAID) {
      throw new RefundPaymentNotPaidError();
    }

    const amount =
      data.amount !== undefined
        ? new Prisma.Decimal(data.amount)
        : new Prisma.Decimal(found.amount);
    if (amount.lte(0) || amount.gt(new Prisma.Decimal(found.amount))) {
      throw new RefundInvalidAmountError(
        "Refund amount must be positive and at most the payment amount",
      );
    }

    const pending = await this.refundRepository.findPendingByPayment(
      data.paymentId,
    );
    if (pending) {
      throw new RefundAlreadyPendingError();
    }

    const refund = await this.refundRepository.create({
      paymentId: found.id,
      orderId: found.orderId,
      amount,
      reason: data.reason ?? null,
      requestedBy: params.requestedBy,
    });

    await this.auditService.record({
      userId: params.requestedBy,
      action: AuditAction.REFUND_REQUESTED,
      entityType: "REFUND",
      entityId: refund.id,
      details: {
        paymentId: found.id,
        orderId: found.orderId,
        amount: Number(amount),
        reason: data.reason ?? null,
      },
    });

    return refund;
  }
}
