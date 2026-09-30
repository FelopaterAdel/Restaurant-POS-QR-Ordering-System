import { RefundStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../../audit/services/audit.service.js";
import { RefundRepository } from "../repositories/refund.repository.js";
import {
  RefundInvalidStatusError,
  RefundNotFoundError,
} from "../use-cases/refund-errors.js";
import {
  ApproveRefundUseCase,
  RejectRefundUseCase,
} from "../use-cases/review-refund.use-case.js";
import { buildRefund } from "./refund.fixture.js";

function setup() {
  const refundRepository = {
    findById: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  } as unknown as RefundRepository;
  const auditService = {
    record: vi.fn(async () => undefined),
  } as unknown as AuditService;
  return {
    refundRepository,
    auditService,
    approve: new ApproveRefundUseCase(refundRepository, auditService),
    reject: new RejectRefundUseCase(refundRepository, auditService),
  };
}

describe("ApproveRefundUseCase", () => {
  it("approves a full refund, voids the payment and audits both", async () => {
    const { refundRepository, auditService, approve } = setup();

    vi.mocked(refundRepository.findById).mockResolvedValueOnce(
      buildRefund() as never,
    );
    vi.mocked(refundRepository.approve).mockResolvedValueOnce(
      buildRefund({ status: RefundStatus.APPROVED }) as never,
    );

    const result = await approve.execute({
      id: "ref_1",
      input: {},
      reviewerId: "user_manager",
    });

    expect(refundRepository.approve).toHaveBeenCalledWith(
      "ref_1",
      "user_manager",
      true,
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REFUND_APPROVED" }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PAYMENT_VOIDED" }),
    );
    expect(result).toMatchObject({ status: "APPROVED" });
  });

  it("approves a partial refund without voiding", async () => {
    const { refundRepository, auditService, approve } = setup();

    vi.mocked(refundRepository.findById).mockResolvedValueOnce(
      buildRefund({ amount: 100 }) as never,
    );
    vi.mocked(refundRepository.approve).mockResolvedValueOnce(
      buildRefund({ status: RefundStatus.APPROVED, amount: 100 }) as never,
    );

    await approve.execute({ id: "ref_1", input: {}, reviewerId: "user_manager" });

    expect(refundRepository.approve).toHaveBeenCalledWith(
      "ref_1",
      "user_manager",
      false,
    );
    expect(auditService.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "PAYMENT_VOIDED" }),
    );
  });

  it("rejects missing and already-reviewed refunds", async () => {
    const { refundRepository, approve } = setup();

    vi.mocked(refundRepository.findById).mockResolvedValueOnce(null as never);
    await expect(
      approve.execute({ id: "missing", input: {}, reviewerId: "user_manager" }),
    ).rejects.toBeInstanceOf(RefundNotFoundError);

    vi.mocked(refundRepository.findById).mockResolvedValueOnce(
      buildRefund() as never,
    );
    vi.mocked(refundRepository.approve).mockResolvedValueOnce(null as never);
    await expect(
      approve.execute({ id: "ref_1", input: {}, reviewerId: "user_manager" }),
    ).rejects.toBeInstanceOf(RefundInvalidStatusError);
  });
});

describe("RejectRefundUseCase", () => {
  it("rejects with a reason and audits", async () => {
    const { refundRepository, auditService, reject } = setup();

    vi.mocked(refundRepository.findById).mockResolvedValueOnce(
      buildRefund() as never,
    );
    vi.mocked(refundRepository.reject).mockResolvedValueOnce(
      buildRefund({ status: RefundStatus.REJECTED }) as never,
    );

    const result = await reject.execute({
      id: "ref_1",
      input: { reason: "No receipt" },
      reviewerId: "user_manager",
    });

    expect(refundRepository.reject).toHaveBeenCalledWith(
      "ref_1",
      "user_manager",
      "No receipt",
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "REFUND_REJECTED" }),
    );
    expect(result).toMatchObject({ status: "REJECTED" });
  });
});
