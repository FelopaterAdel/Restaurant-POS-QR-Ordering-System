import {
  AuditAction,
  OrderStatus,
  Prisma,
  TableStatus,
} from "@restaurant/database";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { AuditService } from "../../audit/services/audit.service.js";
import {
  calculateCouponDiscount,
  ValidateCouponUseCase,
} from "../../coupons/use-cases/validate-coupon.use-case.js";
import { PaymentProviderNotConfiguredError } from "../../../infra/stripe/stripe.service.js";
import {
  defaultOnlineProviders,
  resolveOnlineProvider,
  type OnlineProviderMap,
} from "../../../infra/online-providers.js";
import { PaymentRepository } from "../../payments/repositories/payment.repository.js";
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
  customerPhone: string | null;
  tipAmount: number;
  stripeClientSecret: string | null;
  onlineProvider: string | null;
  paymentRedirectUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CreateOrderItemDTO[];
}

export interface CreateOrderContext {
  actorId?: string;
}

export class CreateOrderUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly validateCoupon: Pick<ValidateCouponUseCase, "execute">;
  private readonly onlineProviders: OnlineProviderMap;
  private readonly paymentRepository: PaymentRepository;
  private readonly auditService: AuditService;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    validateCoupon: Pick<
      ValidateCouponUseCase,
      "execute"
    > = new ValidateCouponUseCase(),
    onlineProviders: OnlineProviderMap = defaultOnlineProviders(),
    paymentRepository: PaymentRepository = new PaymentRepository(),
    auditService: AuditService = new AuditService(),
  ) {
    this.orderRepository = orderRepository;
    this.validateCoupon = validateCoupon;
    this.onlineProviders = onlineProviders;
    this.paymentRepository = paymentRepository;
    this.auditService = auditService;
  }

  async execute(
    input: CreateOrderDTO,
    context: CreateOrderContext = {},
  ): Promise<CreateOrderResultDTO> {
    const data = createOrderSchema.parse(input);

    // Fail fast before creating anything when online payment is requested
    // but no (matching) provider is configured.
    const onlineProvider = data.payOnline
      ? resolveOnlineProvider(data.onlineProvider, this.onlineProviders)
      : null;
    if (data.payOnline && !onlineProvider) {
      throw new PaymentProviderNotConfiguredError();
    }

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
    // The validated coupon is reused to price the checkout tip.
    let coupon: Awaited<
      ReturnType<Pick<ValidateCouponUseCase, "execute">["execute"]>
    > | null = null;
    if (data.couponCode) {
      coupon = await this.validateCoupon.execute(data.couponCode);
    }

    const discountedTotal = coupon
      ? subtotal.sub(calculateCouponDiscount(subtotal, coupon))
      : subtotal;
    const tipAmount =
      data.tipPercent !== undefined
        ? discountedTotal
            .mul(data.tipPercent)
            .div(100)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(data.tipAmount ?? 0);

    const order = await this.orderRepository.createWithItems({
      tableId: data.tableId,
      subtotal,
      items,
      couponCode: data.couponCode,
      customerPhone: data.customerPhone,
      tipAmount,
    });

    await createNotificationForRoles("ORDER_CREATED", {
      title: "New Order",
      message: `Order #${order.orderNumber}`,
      entityType: "ORDER",
      entityId: order.id,
    });

    if (order.couponCode) {
      await this.auditService.record({
        userId: context.actorId ?? null,
        action: AuditAction.DISCOUNT_APPLIED,
        entityType: "ORDER",
        entityId: order.id,
        details: {
          couponCode: order.couponCode,
          discountAmount: Number(order.discountAmount),
        },
      });
    }

    let stripeClientSecret: string | null = null;
    let paymentRedirectUrl: string | null = null;
    if (data.payOnline && onlineProvider) {
      const chargeTotal = Number(order.totalAmount) + Number(order.tipAmount);
      const intent = await onlineProvider.createPaymentIntent({
        amountMinor: Math.round(chargeTotal * 100),
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerPhone,
      });
      await this.paymentRepository.createPendingOnlinePayment({
        orderId: order.id,
        amount: new Prisma.Decimal(chargeTotal),
        provider: onlineProvider.name,
        providerRef: intent.id,
      });
      if (onlineProvider.name === "stripe") {
        stripeClientSecret = intent.clientSecret;
      }
      paymentRedirectUrl = intent.redirectUrl ?? null;
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      couponCode: order.couponCode,
      discountAmount: Number(order.discountAmount),
      customerPhone: order.customerPhone,
      tipAmount: Number(order.tipAmount),
      stripeClientSecret,
      onlineProvider: onlineProvider?.name ?? null,
      paymentRedirectUrl,
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
