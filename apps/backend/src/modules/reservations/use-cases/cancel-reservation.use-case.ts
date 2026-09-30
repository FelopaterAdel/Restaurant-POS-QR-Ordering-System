import { ReservationStatus } from "@restaurant/database";
import { ReservationRepository } from "../repositories/reservation.repository.js";
import { GetReservationUseCase } from "./get-reservation.use-case.js";
import { ReservationInvalidStatusError } from "./reservation-errors.js";

const CANCELLABLE: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

export class CancelReservationUseCase {
  private readonly reservationRepository: ReservationRepository;
  private readonly getReservationUseCase: GetReservationUseCase;

  constructor(
    reservationRepository: ReservationRepository = new ReservationRepository(),
  ) {
    this.reservationRepository = reservationRepository;
    this.getReservationUseCase = new GetReservationUseCase(
      reservationRepository,
    );
  }

  async execute(id: string) {
    const current = await this.getReservationUseCase.execute(id);

    if (!CANCELLABLE.includes(current.status)) {
      throw new ReservationInvalidStatusError(current.status, "CANCELLED");
    }

    return this.reservationRepository.updateStatus(
      id,
      ReservationStatus.CANCELLED,
    );
  }
}
