import { PaymentStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../../audit/services/audit.service.js";
import { PaymentRepository } from "../../payments/repositories/payment.repository.js";
import { RefundRepository } from "../repositories/refund.repository.js";
import {
  RefundAlreadyPendingError,
  RefundInvalidAmountError,
  RefundPaymentMissingError,
  RefundPaymentNotPaidError,
} from "../use-cases/refund-errors.js";
import { RequestRefundUseCase } from "../use-cases/request-refund.use-case.js";
import { buildPaidPayment, buildRefund } from "./refund.fixture.js";

function setup() {
  const refundRepository = {
    findById: vi.fn(),
    findPendingByPayment: vi.fn(),
    findByStatus: vi.fn(),
    create: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  } as unknown as RefundRepository;
  const paymentRepository = {
    findById: vi.fn(),
  } as unknown as PaymentRepository;
  const auditService = {
    record: vi.fn(async () => undefined),
  } as unknown as AuditService;
  const useCase = new RequestRefundUseCase(
    refundRepository,
    paymentRepository,
    auditService,
  );
  return { refundRepository, paymentRepository, auditService, useCase };
}

describe("RequestRefundUseCase", () => {
  it("creates a full refund request and audits it", async () => {
    const { refundRepository, paymentRepository, auditService, useCase } =
      setup();

    vi.mocked(paymentRepository.findById).mockResolvedValueOnce(
      buildPaidPayment() as never,
    );
    vi.mocked(refundRepository.findPendingByPayment).mockResolvedValueOnce(
      null as never,
    );
    vi.mocked(refundRepository.create).mockResolvedValueOnce(
      buildRefund() as never,
    );

    const result = await useCase.execute({
      input: { paymentId: "pay_1", reason: "Customer complaint" },
      requestedBy: "user_cashier",
    });

    expect(refundRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pay_1",
        orderId: "order_1",
        requestedBy: "user_cashier",
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_cashier",
        action: "REFUND_REQUESTED",
      }),
    );
    expect(result).toMatchObject({ id: "ref_1" });
  });

  it("rejects unknown and unpaid payments", async () => {
    const { paymentRepository, useCase } = setup();

    vi.mocked(paymentRepository.findById).mockResolvedValueOnce(null as never);
    await expect(
      useCase.execute({
        input: { paymentId: "missing" },
        requestedBy: "user_cashier",
      }),
    ).rejects.toBeInstanceOf(RefundPaymentMissingError);

    vi.mocked(paymentRepository.findById).mockResolvedValueOnce(
      buildPaidPayment({ status: PaymentStatus.PENDING }) as never,
    );
    await expect(
      useCase.execute({
        input: { paymentId: "pay_1" },
        requestedBy: "user_cashier",
      }),
    ).rejects.toBeInstanceOf(RefundPaymentNotPaidError);
  });

  it("rejects over-amounts and duplicate pending requests", async () => {
    const { refundRepository, paymentRepository, useCase } = setup();

    vi.mocked(paymentRepository.findById).mockResolvedValue(
      buildPaidPayment() as never,
    );
    vi.mocked(refundRepository.findPendingByPayment).mockResolvedValue(null as never);

    await expect(
      useCase.execute({
        input: { paymentId: "pay_1", amount: 500 },
        requestedBy: "user_cashier",
      }),
    ).rejects.toBeInstanceOf(RefundInvalidAmountError);

    vi.mocked(refundRepository.findPendingByPayment).mockResolvedValueOnce(
      buildRefund() as never,
    );
    await expect(
      useCase.execute({
        input: { paymentId: "pay_1" },
        requestedBy: "user_cashier",
      }),
    ).rejects.toBeInstanceOf(RefundAlreadyPendingError);
  });
});
