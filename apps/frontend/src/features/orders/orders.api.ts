import { api } from "@/lib/api";
import type {
  CancelOrderInput,
  CreateOrderInput,
  CreateOrderResult,
  CreatePaymentInput,
  ListOrdersParams,
  Order,
  OrderHistoryItem,
  OrderHistoryParams,
  OrderQueueParams,
  PaginatedOrderHistory,
  PaginatedOrders,
  Payment,
  StaffOrderDetails,
  UpdateOrderStatusInput,
} from "./orders.types";

export async function listOrders(
  params?: ListOrdersParams,
): Promise<PaginatedOrders> {
  return api.getPaginated<Order>("/orders", { params });
}

export async function getOrder(orderId: string): Promise<Order> {
  return api.get<Order>(`/orders/${orderId}`);
}

export async function getOrderQueue(
  params?: OrderQueueParams,
): Promise<PaginatedOrders> {
  return api.getPaginated<Order>("/orders/queue", { params });
}

export async function getOrderHistory(
  params?: OrderHistoryParams,
): Promise<PaginatedOrderHistory> {
  return api.getPaginated<OrderHistoryItem>("/orders/history", { params });
}

export async function getStaffOrderDetails(
  orderId: string,
): Promise<StaffOrderDetails> {
  return api.get<StaffOrderDetails>(`/staff/orders/${orderId}`);
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  return api.post<CreateOrderResult>("/public/orders", input, {
    skipAuthRefresh: true,
  });
}

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput,
): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/status`, input);
}

export async function cancelOrder(
  orderId: string,
  input?: CancelOrderInput,
): Promise<Order> {
  return api.patch<Order>(`/orders/${orderId}/cancel`, input);
}

export async function completeOrder(orderId: string): Promise<Order> {
  return api.post<Order>(`/orders/${orderId}/complete`);
}

export async function payOrder(
  orderId: string,
  input: CreatePaymentInput,
): Promise<Payment> {
  return api.post<Payment>(`/orders/${orderId}/payment`, input);
}
