export interface PublicTable {
  id: string;
  number: number;
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
  categories: PublicCategory[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreatePublicOrderInput {
  tableId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreatePublicOrderResult {
  id: string;
  orderNumber: number;
  tableId: string;
  status: string;
  totalAmount: number;
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
