export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  paidOrders: number;
  activeOrders: number;
}

export type DashboardState =
  | { status: "loading" }
  | { status: "ready"; stats: DashboardStats }
  | { status: "empty" }
  | { status: "error"; message: string };
