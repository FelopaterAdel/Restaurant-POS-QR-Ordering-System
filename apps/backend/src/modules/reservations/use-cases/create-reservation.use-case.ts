import { TableStatus } from "@restaurant/database";
import { TableRepository } from "../../tables/repositories/table.repository.js";
import {
  ReservationRepository,
} from "../repositories/reservation.repository.js";
import {
  createReservationSchema,
  type CreateReservationInput,
} from "../schemas/create-reservation.schema.js";
import {
  ReservationConflictError,
  ReservationInPastError,
  ReservationTableDisabledError,
  ReservationTableNotFoundError,
} from "./reservation-errors.js";

/** Minimum gap between two reservations on the same table. */
export const RESERVATION_SLOT_MS = 2 * 60 * 60 * 1000;

export class CreateReservationUseCase {
  private readonly reservationRepository: ReservationRepository;
  private readonly tableRepository: TableRepository;

  constructor(
    reservationRepository: ReservationRepository = new ReservationRepository(),
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.reservationRepository = reservationRepository;
    this.tableRepository = tableRepository;
  }

  async execute(input: CreateReservationInput) {
    const data = createReservationSchema.parse(input);

    if (data.reservedFor.getTime() <= Date.now()) {
      throw new ReservationInPastError();
    }

    const table = await this.tableRepository.findById(data.tableId);
    if (!table) {
      throw new ReservationTableNotFoundError();
    }
    if (table.status === TableStatus.DISABLED) {
      throw new ReservationTableDisabledError();
    }

    await this.assertNoOverlap(data.tableId, data.reservedFor, null);

    return this.reservationRepository.create(data);
  }

  async assertNoOverlap(
    tableId: string,
    reservedFor: Date,
    excludeId: string | null,
  ): Promise<void> {
    const active =
      await this.reservationRepository.findActiveByTable(tableId);
    const conflict = active.some(
      (row) =>
        row.id !== excludeId &&
        Math.abs(row.reservedFor.getTime() - reservedFor.getTime()) <
          RESERVATION_SLOT_MS,
    );
    if (conflict) {
      throw new ReservationConflictError();
    }
  }
}
