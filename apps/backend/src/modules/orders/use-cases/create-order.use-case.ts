import { OrderStatus, Prisma, TableStatus } from "@restaurant/database";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { ValidateCouponUseCase } from "../../coupons/use-cases/validate-coupon.use-case.js";
import { createNotificationForRoles } from "../../notifications/services/notification.service.js";
import {
  createOrderSchema,
  type CreateOrderDTO,
} from "../schemas/create-order.schema.js";

export class TableNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.TABLE_NOT_FOUND, "Table not found");
    this.name = "TableNotFoundError";
  }
}

export class TableDisabledError extends ConflictError {
  constructor() {
    super(AppErrorCode.TABLE_DISABLED, "Table is disabled");
    this.name = "TableDisabledError";
  }
}

export class ProductNotFoundError extends BadRequestError {
  constructor(productId: string) {
    super(AppErrorCode.PRODUCT_NOT_FOUND, `Product not found: ${productId}`);
    this.name = "ProductNotFoundError";
  }
}

export class ProductUnavailableError extends BadRequestError {
  constructor(productId: string) {
    super(
      AppErrorCode.PRODUCT_UNAVAILABLE,
      `Product is not available: ${productId}`,
    );
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
  orderNumber: number;
  tableId: string;
  status: OrderStatus;
  totalAmount: number;
  couponCode: string | null;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: CreateOrderItemDTO[];
}

export class CreateOrderUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly validateCoupon: Pick<ValidateCouponUseCase, "execute">;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    validateCoupon: Pick<
      ValidateCouponUseCase,
      "execute"
    > = new ValidateCouponUseCase(),
  ) {
    this.orderRepository = orderRepository;
    this.validateCoupon = validateCoupon;
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

    const subtotal = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0),
    );

    // Early validation for clean customer-facing errors; the repository
    // re-validates authoritatively inside the creation transaction.
    if (data.couponCode) {
      await this.validateCoupon.execute(data.couponCode);
    }

    const order = await this.orderRepository.createWithItems({
      tableId: data.tableId,
      subtotal,
      items,
      couponCode: data.couponCode,
    });

    await createNotificationForRoles("ORDER_CREATED", {
      title: "New Order",
      message: `Order #${order.orderNumber}`,
      entityType: "ORDER",
      entityId: order.id,
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      couponCode: order.couponCode,
      discountAmount: Number(order.discountAmount),
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
