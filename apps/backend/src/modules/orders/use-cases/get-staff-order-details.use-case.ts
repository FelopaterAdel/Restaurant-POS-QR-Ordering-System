import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@restaurant/database";
import {
  OrderRepository,
  type StaffOrderWithRelations,
} from "../repositories/order.repository.js";
import { OrderNotFoundError } from "./get-order.use-case.js";

export interface StaffPaymentDTO {
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  paidAt: Date | null;
}

export interface StaffOrderItemDTO {
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StaffOrderDetailsDTO {
  order: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    totalAmount: number;
  };
  table: {
    id: string;
    number: number;
  };
  items: StaffOrderItemDTO[];
  payment: StaffPaymentDTO | null;
}

export function toStaffOrderDetailsDTO(
  order: StaffOrderWithRelations,
): StaffOrderDetailsDTO {
  const latestPayment = order.payments[0];

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
    },
    table: {
      id: order.table.id,
      number: order.table.number,
    },
    items: order.items.map((item) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
      },
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    payment: latestPayment
      ? {
          status: latestPayment.status,
          method: latestPayment.method,
          amount: Number(latestPayment.amount),
          paidAt: latestPayment.paidAt,
        }
      : null,
  };
}

export class GetStaffOrderDetailsUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId: string): Promise<StaffOrderDetailsDTO> {
    const order = await this.orderRepository.findStaffDetailsById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    return toStaffOrderDetailsDTO(order);
  }
}
