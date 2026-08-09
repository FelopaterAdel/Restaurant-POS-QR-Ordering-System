import { OrderRepository } from "../repositories/order.repository.js";
import { toOrderDTO, type OrderDTO } from "./get-order.use-case.js";

export interface ListOrdersPaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListOrdersResultDTO {
  data: OrderDTO[];
  pagination: ListOrdersPaginationDTO;
}

export interface ListOrdersInput {
  page?: number;
  limit?: number;
}

export class ListOrdersUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(input: ListOrdersInput): Promise<ListOrdersResultDTO> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { items, total } = await this.orderRepository.findOrdersPage({
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
