export interface DashboardOrders {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  served: number;
  completed: number;
  cancelled: number;
}

export interface DashboardPayments {
  paidOrders: number;
  totalSales: number;
}

export interface DashboardSalesPoint {
  /** Hour of day ("00".."23") for hourly granularity or a YYYY-MM-DD date for daily. */
  key: string;
  amount: number;
}

export interface DashboardSales {
  granularity: "hourly" | "daily";
  points: DashboardSalesPoint[];
}

export interface DashboardSummary {
  orders: DashboardOrders;
  payments: DashboardPayments;
  sales: DashboardSales;
}

export interface DashboardQueryParams {
  date?: string;
  from?: string;
  to?: string;
}
