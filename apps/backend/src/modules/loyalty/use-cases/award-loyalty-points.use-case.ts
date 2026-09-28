import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { OrderRepository } from "../../orders/repositories/order.repository.js";
import {
  normalizePhone,
  LoyaltyRepository,
} from "../repositories/loyalty.repository.js";
import {
  calculateEarnedPoints,
  pointExpiryDate,
  type LoyaltyTier,
} from "./loyalty-tiers.js";
import { toLoyaltyBalanceDTO } from "./get-loyalty-balance.use-case.js";

export interface AwardLoyaltyPointsInput {
  orderId: string;
}

export interface AwardLoyaltyPointsResult {
  phone: string;
  pointsEarned: number;
  balance: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  alreadyAwarded: boolean;
}

export class AwardLoyaltyPointsUseCase {
  private readonly orderRepository: OrderRepository;
  private readonly loyaltyRepository: LoyaltyRepository;

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    loyaltyRepository: LoyaltyRepository = new LoyaltyRepository(),
  ) {
    this.orderRepository = orderRepository;
    this.loyaltyRepository = loyaltyRepository;
  }

  async execute(input: AwardLoyaltyPointsInput): Promise<AwardLoyaltyPointsResult> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new NotFoundError(AppErrorCode.ORDER_NOT_FOUND, "Order not found");
    }
    if (!order.customerPhone) {
      throw new NotFoundError(
        AppErrorCode.ORDER_NOT_FOUND,
        "Order has no loyalty phone number",
      );
    }

    const phone = normalizePhone(order.customerPhone);
    const points = calculateEarnedPoints(order.totalAmount.toString());

    if (points <= 0) {
      const summary = await this.summarize(phone);
      return { ...summary, pointsEarned: 0, alreadyAwarded: false };
    }

    const { created } = await this.loyaltyRepository.awardForOrder({
      phone,
      orderId: order.id,
      points,
      expiresAt: pointExpiryDate(),
    });

    const summary = await this.summarize(phone);
    return {
      ...summary,
      pointsEarned: created ? points : 0,
      alreadyAwarded: !created,
    };
  }

  private async summarize(phone: string) {
    const account = await this.loyaltyRepository.findAccountByPhone(phone);
    if (!account) {
      return toLoyaltyBalanceDTO(phone, []);
    }
    const entries = await this.loyaltyRepository.findEntriesByAccountId(
      account.id,
    );
    return toLoyaltyBalanceDTO(account.phone, entries);
  }
}
