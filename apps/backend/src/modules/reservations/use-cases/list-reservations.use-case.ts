import { ReservationStatus } from "@restaurant/database";
import { ReservationRepository } from "../repositories/reservation.repository.js";

export interface ListReservationsInput {
  date?: string;
  status?: ReservationStatus;
  now?: Date;
}

function dayBounds(date: string): { gte: Date; lt: Date } {
  const [year, month, day] = date.split("-").map(Number);
  const gte = new Date(Date.UTC(year, month - 1, day));
  const lt = new Date(Date.UTC(year, month - 1, day + 1));
  return { gte, lt };
}

export class ListReservationsUseCase {
  private readonly reservationRepository: ReservationRepository;

  constructor(
    reservationRepository: ReservationRepository = new ReservationRepository(),
  ) {
    this.reservationRepository = reservationRepository;
  }

  async execute(input: ListReservationsInput = {}) {
    const date =
      input.date ?? (input.now ?? new Date()).toISOString().slice(0, 10);
    const rows = await this.reservationRepository.findByDate(dayBounds(date));
    if (input.status) {
      return rows.filter((row) => row.status === input.status);
    }
    return rows;
  }
}
