import { OrderStatus, Prisma, TableStatus } from "@restaurant/database";
import { OrderRepository } from "../repositories/order.repository.js";
import {
  createOrderSchema,
  type CreateOrderDTO,
} from "../schemas/create-order.schema.js";

export class TableNotFoundError extends Error {
  constructor() {
    super("Table not found");
    this.name = "TableNotFoundError";
  }
}

export class TableDisabledError extends Error {
  constructor() {
    super("Table is disabled");
    this.name = "TableDisabledError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = "ProductNotFoundError";
  }
}

export class ProductUnavailableError extends Error {
  constructor(productId: string) {
    super(`Product is not available: ${productId}`);
    this.name = "ProductUnavailableError";
  }
}

export interface CreateOrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderResultDTO {
  id: string;
  tableId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: CreateOrderItemDTO[];
}

export class CreateOrderUseCase {
  private readonly orderRepository: OrderRepository;

  constructor(orderRepository: OrderRepository = new OrderRepository()) {
    this.orderRepository = orderRepository;
  }

  async execute(input: CreateOrderDTO): Promise<CreateOrderResultDTO> {
    const data = createOrderSchema.parse(input);

    const table = await this.orderRepository.findTableById(data.tableId);
    if (!table) {
      throw new TableNotFoundError();
    }

    if (table.status === TableStatus.DISABLED) {
      throw new TableDisabledError();
    }

    const productIds = [...new Set(data.items.map((item) => item.productId))];
    const products = await this.orderRepository.findProductsByIds(productIds);
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const items = data.items.map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      if (!product.isAvailable || product.isDeleted) {
        throw new ProductUnavailableError(item.productId);
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice.mul(item.quantity);

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0),
    );

    const order = await this.orderRepository.createWithItems({
      tableId: data.tableId,
      totalAmount,
      items,
    });

    return {
      id: order.id,
      tableId: order.tableId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }
}
