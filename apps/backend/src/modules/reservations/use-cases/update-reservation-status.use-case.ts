import { ReservationStatus } from "@restaurant/database";
import { ReservationRepository } from "../repositories/reservation.repository.js";
import {
  updateReservationStatusSchema,
  type UpdateReservationStatusDTO,
} from "../schemas/update-reservation-status.schema.js";
import { GetReservationUseCase } from "./get-reservation.use-case.js";
import { ReservationInvalidStatusError } from "./reservation-errors.js";

const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [
    ReservationStatus.CONFIRMED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.SEATED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.SEATED]: [ReservationStatus.COMPLETED],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.COMPLETED]: [],
};

export class UpdateReservationStatusUseCase {
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

  async execute(id: string, input: UpdateReservationStatusDTO) {
    const data = updateReservationStatusSchema.parse(input);
    const current = await this.getReservationUseCase.execute(id);

    if (!ALLOWED_TRANSITIONS[current.status].includes(data.status)) {
      throw new ReservationInvalidStatusError(current.status, data.status);
    }

    return this.reservationRepository.updateStatus(id, data.status);
  }
}
