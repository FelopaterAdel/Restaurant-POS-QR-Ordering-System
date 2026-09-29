import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import {
  getDateRangeInTimeZone,
  getDayRangeInTimeZone,
} from "./get-dashboard-summary.use-case.js";

export interface TopProductDTO {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface GetTopProductsInput {
  from?: string;
  to?: string;
  limit?: number;
  now?: Date;
}

export class GetTopProductsUseCase {
  private readonly dashboardRepository: DashboardRepository;
  private readonly productRepository: ProductRepository;

  constructor(
    dashboardRepository: DashboardRepository = new DashboardRepository(),
    productRepository: ProductRepository = new ProductRepository(),
  ) {
    this.dashboardRepository = dashboardRepository;
    this.productRepository = productRepository;
  }

  async execute(input: GetTopProductsInput = {}): Promise<TopProductDTO[]> {
    const limit = input.limit ?? 10;
    const range =
      input.from && input.to
        ? getDateRangeInTimeZone(input.from, input.to, RESTAURANT_TIMEZONE)
        : getDayRangeInTimeZone(input.now ?? new Date(), RESTAURANT_TIMEZONE);

    const rows = await this.dashboardRepository.findTopProducts(range, limit);
    if (rows.length === 0) {
      return [];
    }

    const products = await this.productRepository.findProductsByIds(
      rows.map((row) => row.productId),
    );
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    return rows.map((row) => ({
      productId: row.productId,
      productName: nameById.get(row.productId) ?? "Unknown product",
      quantity: row.quantity,
      revenue: Number(row.revenue ?? 0),
    }));
  }
}
