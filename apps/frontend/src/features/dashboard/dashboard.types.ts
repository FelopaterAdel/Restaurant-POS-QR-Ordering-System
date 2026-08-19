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

export interface DashboardSummary {
  orders: DashboardOrders;
  payments: DashboardPayments;
}

export interface DashboardQueryParams {
  date?: string;
}
