import { prisma, ReservationStatus } from "@restaurant/database";
import type { PrismaClient } from "@restaurant/database";

export interface CreateReservationInput {
  customerName: string;
  phone: string;
  partySize: number;
  tableId: string;
  reservedFor: Date;
}

export interface UpdateReservationInput {
  customerName?: string;
  phone?: string;
  partySize?: number;
  tableId?: string;
  reservedFor?: Date;
}

export interface ReservationDateFilter {
  gte: Date;
  lt: Date;
}

const withTable = {
  table: {
    select: { id: true, number: true, name: true },
  },
} as const;

export class ReservationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.client.reservation.findUnique({
      where: { id },
      include: withTable,
    });
  }

  async findByDate(range: ReservationDateFilter) {
    return this.client.reservation.findMany({
      where: {
        reservedFor: { gte: range.gte, lt: range.lt },
      },
      include: withTable,
      orderBy: { reservedFor: "asc" },
    });
  }

  async findActiveByTable(tableId: string) {
    return this.client.reservation.findMany({
      where: {
        tableId,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      orderBy: { reservedFor: "asc" },
    });
  }

  async create(data: CreateReservationInput) {
    return this.client.reservation.create({
      data,
      include: withTable,
    });
  }

  async update(id: string, data: UpdateReservationInput) {
    return this.client.reservation.update({
      where: { id },
      data,
      include: withTable,
    });
  }

  async updateStatus(id: string, status: ReservationStatus) {
    return this.client.reservation.update({
      where: { id },
      data: { status },
      include: withTable,
    });
  }
}
