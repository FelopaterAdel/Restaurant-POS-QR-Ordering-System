import { Prisma } from "@restaurant/database";
import { AuditAction } from "@restaurant/database";
import { AuditService } from "../../audit/services/audit.service.js";
import { RefundRepository } from "../repositories/refund.repository.js";
import {
  reviewRefundSchema,
  type ReviewRefundDTO,
} from "../schemas/review-refund.schema.js";
import {
  RefundInvalidStatusError,
  RefundNotFoundError,
} from "./refund-errors.js";

export interface ReviewRefundParams {
  id: string;
  input: ReviewRefundDTO;
  reviewerId: string;
}

export class ApproveRefundUseCase {
  private readonly refundRepository: RefundRepository;
  private readonly auditService: AuditService;

  constructor(
    refundRepository: RefundRepository = new RefundRepository(),
    auditService: AuditService = new AuditService(),
  ) {
    this.refundRepository = refundRepository;
    this.auditService = auditService;
  }

  async execute(params: ReviewRefundParams) {
    reviewRefundSchema.parse(params.input);

    const current = await this.refundRepository.findById(params.id);
    if (!current) {
      throw new RefundNotFoundError();
    }

    const fullRefund = new Prisma.Decimal(current.amount).gte(
      new Prisma.Decimal(current.payment.amount),
    );

    const approved = await this.refundRepository.approve(
      params.id,
      params.reviewerId,
      fullRefund,
    );
    if (!approved) {
      throw new RefundInvalidStatusError();
    }

    await this.auditService.record({
      userId: params.reviewerId,
      action: AuditAction.REFUND_APPROVED,
      entityType: "REFUND",
      entityId: approved.id,
      details: {
        paymentId: approved.paymentId,
        orderId: approved.orderId,
        amount: Number(approved.amount),
        fullRefund,
      },
    });

    if (fullRefund) {
      await this.auditService.record({
        userId: params.reviewerId,
        action: AuditAction.PAYMENT_VOIDED,
        entityType: "PAYMENT",
        entityId: approved.paymentId,
        details: { orderId: approved.orderId, refundId: approved.id },
      });
    }

    return approved;
  }
}

export class RejectRefundUseCase {
  private readonly refundRepository: RefundRepository;
  private readonly auditService: AuditService;

  constructor(
    refundRepository: RefundRepository = new RefundRepository(),
    auditService: AuditService = new AuditService(),
  ) {
    this.refundRepository = refundRepository;
    this.auditService = auditService;
  }

  async execute(params: ReviewRefundParams) {
    const data = reviewRefundSchema.parse(params.input);

    const current = await this.refundRepository.findById(params.id);
    if (!current) {
      throw new RefundNotFoundError();
    }

    const rejected = await this.refundRepository.reject(
      params.id,
      params.reviewerId,
      data.reason ?? null,
    );
    if (!rejected) {
      throw new RefundInvalidStatusError();
    }

    await this.auditService.record({
      userId: params.reviewerId,
      action: AuditAction.REFUND_REJECTED,
      entityType: "REFUND",
      entityId: rejected.id,
      details: {
        paymentId: rejected.paymentId,
        orderId: rejected.orderId,
        reason: data.reason ?? null,
      },
    });

    return rejected;
  }
}
