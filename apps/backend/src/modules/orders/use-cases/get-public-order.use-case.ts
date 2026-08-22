import { OrderRepository } from "../repositories/order.repository.js";
import {
  getPublicOrderParamsSchema,
  getPublicOrderQuerySchema,
} from "../schemas/get-public-order.schema.js";
import {
  OrderNotFoundError,
  toOrderDTO,
  type OrderDTO,
} from "./get-order.use-case.js";

export class GetPublicOrderUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(params: unknown, query: unknown): Promise<OrderDTO> {
    const { orderId } = getPublicOrderParamsSchema.parse(params);
    const { qrCode } = getPublicOrderQuerySchema.parse(query);

    const order = await this.orderRepository.findPublicViewById(orderId);

    if (!order || order.table.qrCode !== qrCode) {
      throw new OrderNotFoundError();
    }

    return toOrderDTO(order);
  }
}
