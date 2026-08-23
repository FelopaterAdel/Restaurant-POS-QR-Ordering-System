import type { PaymentMethod, PaymentStatus } from "@restaurant/database";
import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import { getDayRangeForDateInTimeZone } from "../../dashboard/use-cases/get-dashboard-summary.use-case.js";
import {
  PaymentRepository,
  type PaidPaymentWithOrder,
} from "../repositories/payment.repository.js";

export interface PaymentHistoryItemDTO {
  id: string;
  orderNumber: number;
  tableNumber: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date | null;
}

export interface PaymentHistoryPaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentHistoryResultDTO {
  data: PaymentHistoryItemDTO[];
  pagination: PaymentHistoryPaginationDTO;
}

export interface PaymentSummaryDTO {
  totalSales: number;
  paidCount: number;
}

export interface PaymentHistoryFilterInput {
  from?: string;
  to?: string;
  orderNumber?: number;
}

export interface GetPaymentHistoryInput extends PaymentHistoryFilterInput {
  page?: number;
  limit?: number;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return next.toISOString().slice(0, 10);
}

export function resolvePaidAtRange(
  from?: string,
  to?: string,
): { gte: Date; lt: Date } | undefined {
  if (!from && !to) {
    return undefined;
  }

  const effectiveFrom = from ?? to as string;
  const effectiveTo = to ?? from as string;

  const gte = getDayRangeForDateInTimeZone(
    effectiveFrom,
    RESTAURANT_TIMEZONE,
  ).start;
  const lt = getDayRangeForDateInTimeZone(
    addDays(effectiveTo, 1),
    RESTAURANT_TIMEZONE,
  ).start;

  return { gte, lt };
}

function toPaymentHistoryItemDTO(
  payment: PaidPaymentWithOrder,
): PaymentHistoryItemDTO {
  return {
    id: payment.id,
    orderNumber: payment.order.orderNumber,
    tableNumber: payment.order.table.number,
    amount: Number(payment.amount),
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
  };
}

export class GetPaymentHistoryUseCase {
  private readonly paymentRepository: PaymentRepository;

  constructor(paymentRepository: PaymentRepository = new PaymentRepository()) {
    this.paymentRepository = paymentRepository;
  }

  async execute(
    input: GetPaymentHistoryInput = {},
  ): Promise<PaymentHistoryResultDTO> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { items, total } = await this.paymentRepository.findPaidPage({
      paidAt: resolvePaidAtRange(input.from, input.to),
      orderNumber: input.orderNumber,
      page,
      limit,
    });

    return {
      data: items.map(toPaymentHistoryItemDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export class GetPaymentSummaryUseCase {
  private readonly paymentRepository: PaymentRepository;

  constructor(paymentRepository: PaymentRepository = new PaymentRepository()) {
    this.paymentRepository = paymentRepository;
  }

  async execute(input: PaymentHistoryFilterInput = {}): Promise<PaymentSummaryDTO> {
    const result = await this.paymentRepository.summarizePaidPayments({
      paidAt: resolvePaidAtRange(input.from, input.to),
      orderNumber: input.orderNumber,
    });

    return {
      totalSales: Number(result.totalSales ?? 0),
      paidCount: result.count,
    };
  }
}
