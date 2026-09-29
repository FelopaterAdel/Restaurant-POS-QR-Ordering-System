import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import {
  DashboardRepository,
  type DayRange,
} from "../repositories/dashboard.repository.js";
import {
  addDays,
  getDateRangeInTimeZone,
  getDayRangeInTimeZone,
} from "./get-dashboard-summary.use-case.js";

export type RevenueGranularity = "day" | "week" | "month";

export interface RevenuePointDTO {
  key: string;
  amount: number;
  orders: number;
}

export interface GetRevenueTrendInput {
  from?: string;
  to?: string;
  granularity?: RevenueGranularity;
  now?: Date;
}

function localDateOf(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Monday (local) starting the week of `date`. */
function weekStartOf(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dow = utc.getUTCDay();
  const shift = (dow + 6) % 7;
  return addDays(date, -shift);
}

function monthStartOf(date: string): string {
  return date.slice(0, 7);
}

function bucketKey(
  date: string,
  granularity: RevenueGranularity,
): string {
  if (granularity === "week") {
    return weekStartOf(date);
  }
  if (granularity === "month") {
    return monthStartOf(date);
  }
  return date;
}

export class GetRevenueTrendUseCase {
  private readonly dashboardRepository: DashboardRepository;

  constructor(
    dashboardRepository: DashboardRepository = new DashboardRepository(),
  ) {
    this.dashboardRepository = dashboardRepository;
  }

  async execute(input: GetRevenueTrendInput = {}): Promise<RevenuePointDTO[]> {
    const granularity = input.granularity ?? "day";
    const range = this.resolveRange(input);

    const payments = await this.dashboardRepository.findPaidPayments(range);

    const buckets = new Map<string, { amount: number; orders: number }>();
    for (const payment of payments) {
      const key = bucketKey(
        localDateOf(payment.paidAt, RESTAURANT_TIMEZONE),
        granularity,
      );
      const bucket = buckets.get(key) ?? { amount: 0, orders: 0 };
      bucket.amount += Number(payment.amount);
      bucket.orders += 1;
      buckets.set(key, bucket);
    }

    return this.fillRange(range, granularity, buckets);
  }

  private resolveRange(input: GetRevenueTrendInput): DayRange {
    if (input.from && input.to) {
      return getDateRangeInTimeZone(input.from, input.to, RESTAURANT_TIMEZONE);
    }
    return getDayRangeInTimeZone(input.now ?? new Date(), RESTAURANT_TIMEZONE);
  }

  private fillRange(
    range: DayRange,
    granularity: RevenueGranularity,
    buckets: Map<string, { amount: number; orders: number }>,
  ): RevenuePointDTO[] {
    // Walk local days so DST transitions cannot skip or duplicate a bucket.
    const endLocal = localDateOf(
      new Date(range.end.getTime() - 1),
      RESTAURANT_TIMEZONE,
    );
    const points: RevenuePointDTO[] = [];
    const seen = new Set<string>();
    let cursor = localDateOf(range.start, RESTAURANT_TIMEZONE);

    for (let guard = 0; guard < 1500; guard += 1) {
      const key = bucketKey(cursor, granularity);
      if (!seen.has(key)) {
        seen.add(key);
        const bucket = buckets.get(key) ?? { amount: 0, orders: 0 };
        points.push({ key, amount: bucket.amount, orders: bucket.orders });
      }
      if (cursor >= endLocal) {
        break;
      }
      cursor = addDays(cursor, 1);
    }

    return points;
  }
}
