import { OrderStatus } from "@restaurant/database";
import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import {
  DashboardRepository,
  type DayRange,
  type PaidPaymentRow,
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

export interface DashboardSalesPointDTO {
  key: string;
  amount: number;
}

export interface DashboardSalesDTO {
  granularity: "hourly" | "daily";
  points: DashboardSalesPointDTO[];
}

export interface DashboardSummaryDTO {
  orders: DashboardOrdersDTO;
  payments: DashboardPaymentsDTO;
  sales: DashboardSalesDTO;
}

export interface GetDashboardSummaryInput {
  date?: string;
  from?: string;
  to?: string;
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

export function addDays(date: string, days: number): string {
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

export function getDateRangeInTimeZone(
  from: string,
  to: string,
  timeZone: string,
): DayRange {
  const start = startOfLocalDay(from, timeZone);
  const end = startOfLocalDay(addDays(to, 1), timeZone);

  return { start, end };
}

function countDaysInRange(range: DayRange, timeZone: string): number {
  const startDate = localDateOf(range.start, timeZone);
  const endDate = localDateOf(new Date(range.end.getTime() - 1), timeZone);

  const [startY, startM, startD] = startDate.split("-").map(Number);
  const [endY, endM, endD] = endDate.split("-").map(Number);

  const startUtc = Date.UTC(startY, startM - 1, startD);
  const endUtc = Date.UTC(endY, endM - 1, endD);

  return Math.round((endUtc - startUtc) / (24 * 60 * 60 * 1000)) + 1;
}

function localHourOf(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";

  return Number(hour) % 24;
}

function buildHourlyTrend(
  payments: PaidPaymentRow[],
  timeZone: string,
): DashboardSalesDTO {
  const amounts = Array.from<number>({ length: 24 }).fill(0);

  for (const payment of payments) {
    amounts[localHourOf(payment.paidAt, timeZone)] += Number(payment.amount);
  }

  return {
    granularity: "hourly",
    points: amounts.map((amount, hour) => ({
      key: String(hour).padStart(2, "0"),
      amount,
    })),
  };
}

function buildDailyTrend(
  payments: PaidPaymentRow[],
  range: DayRange,
  timeZone: string,
): DashboardSalesDTO {
  const days: string[] = [];
  const dayCount = countDaysInRange(range, timeZone);
  let cursor = localDateOf(range.start, timeZone);

  for (let index = 0; index < dayCount; index += 1) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const amountsByDay = new Map<string, number>(
    days.map((day) => [day, 0]),
  );

  for (const payment of payments) {
    const day = localDateOf(payment.paidAt, timeZone);
    const current = amountsByDay.get(day);
    if (current !== undefined) {
      amountsByDay.set(day, current + Number(payment.amount));
    }
  }

  return {
    granularity: "daily",
    points: days.map((day) => ({
      key: day,
      amount: amountsByDay.get(day) ?? 0,
    })),
  };
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
    let range: DayRange;

    if (input.from && input.to) {
      range = getDateRangeInTimeZone(input.from, input.to, RESTAURANT_TIMEZONE);
    } else if (input.date) {
      range = getDayRangeForDateInTimeZone(input.date, RESTAURANT_TIMEZONE);
    } else {
      range = getDayRangeInTimeZone(input.now ?? new Date(), RESTAURANT_TIMEZONE);
    }

    const result = await this.dashboardRepository.findSummary(range);

    const statusCounts = toZeroedStatusCounts();
    let total = 0;

    for (const group of result.orderCountsByStatus) {
      statusCounts[group.status] = group.count;
      total += group.count;
    }

    const sales =
      countDaysInRange(range, RESTAURANT_TIMEZONE) > 1
        ? buildDailyTrend(result.paidPayments, range, RESTAURANT_TIMEZONE)
        : buildHourlyTrend(result.paidPayments, RESTAURANT_TIMEZONE);

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
      sales,
    };
  }
}
