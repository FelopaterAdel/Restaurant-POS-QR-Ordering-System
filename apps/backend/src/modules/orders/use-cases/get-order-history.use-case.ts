import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@restaurant/database";
import {
  OrderRepository,
  type OrderHistoryWithRelations,
} from "../repositories/order.repository.js";

export interface OrderHistoryPaymentDTO {
  status: PaymentStatus;
  method: PaymentMethod | null;
}

export interface OrderHistoryItemDTO {
  id: string;
  orderNumber: number;
  table: {
    number: number;
  };
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  payment: OrderHistoryPaymentDTO;
}

export interface OrderHistoryPaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderHistoryResultDTO {
  data: OrderHistoryItemDTO[];
  pagination: OrderHistoryPaginationDTO;
}

export interface GetOrderHistoryInput {
  orderNumber?: number;
  status?: OrderStatus;
  date?: string;
  page?: number;
  limit?: number;
}

function toUTCDateRange(date: string): { gte: Date; lt: Date } {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(Date.UTC(year, month - 1, day + 1));

  return { gte: start, lt: end };
}

function toOrderHistoryItemDTO(
  order: OrderHistoryWithRelations,
): OrderHistoryItemDTO {
  const latestPayment = order.payments[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    table: {
      number: order.table.number,
    },
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    payment: {
      status: order.paymentStatus,
      method: latestPayment?.method ?? null,
    },
  };
}

export class GetOrderHistoryUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(input: GetOrderHistoryInput): Promise<OrderHistoryResultDTO> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { items, total } = await this.orderRepository.findHistoryPage({
      orderNumber: input.orderNumber,
      status: input.status,
      createdAt: input.date ? toUTCDateRange(input.date) : undefined,
      page,
      limit,
    });

    return {
      data: items.map(toOrderHistoryItemDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
