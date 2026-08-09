import type { OrderStatus } from "@restaurant/database";
import { OrderRepository } from "../repositories/order.repository.js";
import { toOrderDTO, type OrderDTO } from "./get-order.use-case.js";
import { ACTIVE_ORDER_QUEUE_STATUSES } from "../schemas/get-order-queue.schema.js";

export interface OrderQueuePaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderQueueResultDTO {
  data: OrderDTO[];
  pagination: OrderQueuePaginationDTO;
}

export interface GetOrderQueueInput {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export class GetOrderQueueUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(input: GetOrderQueueInput): Promise<OrderQueueResultDTO> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;
    const statuses = input.status
      ? [input.status]
      : [...ACTIVE_ORDER_QUEUE_STATUSES];

    const { items, total } = await this.orderRepository.findQueuePage({
      statuses,
      page,
      limit,
    });

    return {
      data: items.map(toOrderDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
