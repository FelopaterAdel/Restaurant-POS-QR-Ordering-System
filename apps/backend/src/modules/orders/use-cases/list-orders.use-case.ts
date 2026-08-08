import { OrderRepository } from "../repositories/order.repository.js";
import { toOrderDTO, type OrderDTO } from "./get-order.use-case.js";

export class ListOrdersUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(): Promise<OrderDTO[]> {
    const orders = await this.orderRepository.findMany();

    return orders.map(toOrderDTO);
  }
}
