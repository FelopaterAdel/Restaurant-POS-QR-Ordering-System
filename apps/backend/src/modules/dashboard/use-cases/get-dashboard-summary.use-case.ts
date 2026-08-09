import { OrderStatus } from "@restaurant/database";
import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import {
  DashboardRepository,
  type DayRange,
} from "../repositories/dashboard.repository.js";

export interface DashboardOrdersDTO {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  served: number;
  completed: number;
  cancelled: number;
}

export interface DashboardPaymentsDTO {
  paidOrders: number;
  totalSales: number;
}

export interface DashboardSummaryDTO {
  orders: DashboardOrdersDTO;
  payments: DashboardPaymentsDTO;
}

export interface GetDashboardSummaryInput {
  date?: string;
  now?: Date;
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(instant);

  const name = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!name || name === "GMT" || name === "UTC") {
    return 0;
  }

  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const totalMinutes = Number(match[2]) * 60 + Number(match[3]);

  return sign * totalMinutes * 60 * 1000;
}

function formatOffset(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "+";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return next.toISOString().slice(0, 10);
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

function startOfLocalDay(date: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const midnightGuess = new Date(Date.UTC(year, month - 1, day));

  const offsetMinutes =
    getTimeZoneOffsetMs(midnightGuess, timeZone) / (60 * 1000);

  return new Date(`${date}T00:00:00${formatOffset(offsetMinutes)}`);
}

export function getDayRangeForDateInTimeZone(
  date: string,
  timeZone: string,
): DayRange {
  const start = startOfLocalDay(date, timeZone);
  const end = startOfLocalDay(addDays(date, 1), timeZone);

  return { start, end };
}

export function getDayRangeInTimeZone(
  now: Date,
  timeZone: string,
): DayRange {
  return getDayRangeForDateInTimeZone(localDateOf(now, timeZone), timeZone);
}

function toZeroedStatusCounts(): Record<OrderStatus, number> {
  return {
    [OrderStatus.PENDING]: 0,
    [OrderStatus.CONFIRMED]: 0,
    [OrderStatus.PREPARING]: 0,
    [OrderStatus.READY]: 0,
    [OrderStatus.SERVED]: 0,
    [OrderStatus.COMPLETED]: 0,
    [OrderStatus.CANCELLED]: 0,
  };
}

export class GetDashboardSummaryUseCase {
  private readonly dashboardRepository: DashboardRepository;

  constructor(
    dashboardRepository: DashboardRepository = new DashboardRepository(),
  ) {
    this.dashboardRepository = dashboardRepository;
  }

  async execute(input: GetDashboardSummaryInput = {}): Promise<DashboardSummaryDTO> {
    const range = input.date
      ? getDayRangeForDateInTimeZone(input.date, RESTAURANT_TIMEZONE)
      : getDayRangeInTimeZone(input.now ?? new Date(), RESTAURANT_TIMEZONE);

    const result = await this.dashboardRepository.findTodaySummary(range);

    const statusCounts = toZeroedStatusCounts();
    let total = 0;

    for (const group of result.orderCountsByStatus) {
      statusCounts[group.status] = group.count;
      total += group.count;
    }

    return {
      orders: {
        total,
        pending: statusCounts[OrderStatus.PENDING],
        confirmed: statusCounts[OrderStatus.CONFIRMED],
        preparing: statusCounts[OrderStatus.PREPARING],
        ready: statusCounts[OrderStatus.READY],
        served: statusCounts[OrderStatus.SERVED],
        completed: statusCounts[OrderStatus.COMPLETED],
        cancelled: statusCounts[OrderStatus.CANCELLED],
      },
      payments: {
        paidOrders: result.paidOrdersCount,
        totalSales: Number(result.totalSales ?? 0),
      },
    };
  }
}
