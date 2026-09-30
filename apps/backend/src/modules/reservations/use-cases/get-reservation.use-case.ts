import { ReservationRepository } from "../repositories/reservation.repository.js";
import { ReservationNotFoundError } from "./reservation-errors.js";

export class GetReservationUseCase {
  private readonly reservationRepository: ReservationRepository;

  constructor(
    reservationRepository: ReservationRepository = new ReservationRepository(),
  ) {
    this.reservationRepository = reservationRepository;
  }

  async execute(id: string) {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new ReservationNotFoundError();
    }
    return reservation;
  }
}
