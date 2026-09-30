import { ReservationStatus, TableStatus } from "@restaurant/database";
import { TableRepository } from "../../tables/repositories/table.repository.js";
import { ReservationRepository } from "../repositories/reservation.repository.js";
import {
  updateReservationSchema,
  type UpdateReservationDTO,
} from "../schemas/update-reservation.schema.js";
import { CreateReservationUseCase } from "./create-reservation.use-case.js";
import { GetReservationUseCase } from "./get-reservation.use-case.js";
import {
  ReservationInPastError,
  ReservationInvalidStatusError,
  ReservationTableDisabledError,
  ReservationTableNotFoundError,
} from "./reservation-errors.js";

const EDITABLE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

export class UpdateReservationUseCase {
  private readonly reservationRepository: ReservationRepository;
  private readonly tableRepository: TableRepository;
  private readonly getReservationUseCase: GetReservationUseCase;
  private readonly overlapChecker: CreateReservationUseCase;

  constructor(
    reservationRepository: ReservationRepository = new ReservationRepository(),
    tableRepository: TableRepository = new TableRepository(),
  ) {
    this.reservationRepository = reservationRepository;
    this.tableRepository = tableRepository;
    this.getReservationUseCase = new GetReservationUseCase(
      reservationRepository,
    );
    this.overlapChecker = new CreateReservationUseCase(
      reservationRepository,
      tableRepository,
    );
  }

  async execute(id: string, input: UpdateReservationDTO) {
    const data = updateReservationSchema.parse(input);
    const current = await this.getReservationUseCase.execute(id);

    if (!EDITABLE_STATUSES.includes(current.status)) {
      throw new ReservationInvalidStatusError(current.status, "EDIT");
    }

    if (data.reservedFor && data.reservedFor.getTime() <= Date.now()) {
      throw new ReservationInPastError();
    }

    const tableId = data.tableId ?? current.tableId;
    const reservedFor = data.reservedFor ?? current.reservedFor;

    if (data.tableId) {
      const table = await this.tableRepository.findById(data.tableId);
      if (!table) {
        throw new ReservationTableNotFoundError();
      }
      if (table.status === TableStatus.DISABLED) {
        throw new ReservationTableDisabledError();
      }
    }

    await this.overlapChecker.assertNoOverlap(tableId, reservedFor, id);

    return this.reservationRepository.update(id, data);
  }
}
