export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export type RevenueGranularity = "day" | "week" | "month";

export interface RevenuePoint {
  key: string;
  amount: number;
  orders: number;
}

export interface StockSummary {
  totalActive: number;
  lowCount: number;
  outOfStockCount: number;
  lowStock: Array<{
    id: string;
    name: string;
    unit: string;
    quantityInStock: number | string;
    lowStockThreshold: number | string;
  }>;
}

export interface AnalyticsRange {
  from?: string;
  to?: string;
}
