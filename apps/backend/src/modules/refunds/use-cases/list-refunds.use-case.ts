import { RefundStatus } from "@restaurant/database";
import { RefundRepository } from "../repositories/refund.repository.js";

export class ListRefundsUseCase {
  private readonly refundRepository: RefundRepository;

  constructor(refundRepository: RefundRepository = new RefundRepository()) {
    this.refundRepository = refundRepository;
  }

  async execute(status: RefundStatus = RefundStatus.PENDING) {
    return this.refundRepository.findByStatus(status);
  }
}
