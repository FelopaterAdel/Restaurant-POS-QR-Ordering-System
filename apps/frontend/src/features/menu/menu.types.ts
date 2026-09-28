export interface PublicTable {
  id: string;
  number: number;
}

export interface PublicRestaurant {
  name: string;
  logoUrl: string | null;
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface PublicCategory {
  id: string;
  name: string;
  products: PublicProduct[];
}

export interface PublicMenu {
  table: PublicTable;
  restaurant: PublicRestaurant | null;
  categories: PublicCategory[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartSession {
  qrCode: string;
  tableId: string;
  tableNumber: number;
  items: CartItem[];
}

export type PublicOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export interface PublicOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PublicOrder {
  id: string;
  orderNumber: number;
  tableId: string;
  tableNumber: number;
  status: PublicOrderStatus;
  totalAmount: number;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: PublicOrderItem[];
}

export interface CreatePublicOrderInput {
  tableId: string;
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
  customerPhone?: string;
}

export interface CreatePublicOrderResult {
  id: string;
  orderNumber: number;
  tableId: string;
  status: string;
  totalAmount: number;
  couponCode: string | null;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}
