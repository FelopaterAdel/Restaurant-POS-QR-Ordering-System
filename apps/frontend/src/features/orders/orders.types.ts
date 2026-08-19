import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/components/ui";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedOrders {
  data: Order[];
  pagination: Pagination;
}

export interface OrderHistoryItem {
  id: string;
  orderNumber: number;
  table: {
    number: number;
  };
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  payment: {
    status: PaymentStatus;
    method: PaymentMethod | null;
  };
}

export interface PaginatedOrderHistory {
  data: OrderHistoryItem[];
  pagination: Pagination;
}

export interface StaffOrderItem {
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StaffPayment {
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  paidAt: string | null;
}

export interface StaffOrderDetails {
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
  items: StaffOrderItem[];
  payment: StaffPayment | null;
}

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  tableId: string;
  items: CreateOrderItem[];
}

export interface CreateOrderResult {
  id: string;
  orderNumber: number;
  tableId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface CancelOrderInput {
  reason?: string;
}

export interface CreatePaymentInput {
  method: PaymentMethod;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
}

export interface OrderQueueParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface OrderHistoryParams {
  orderNumber?: number;
  status?: OrderStatus;
  date?: string;
  page?: number;
  limit?: number;
}
