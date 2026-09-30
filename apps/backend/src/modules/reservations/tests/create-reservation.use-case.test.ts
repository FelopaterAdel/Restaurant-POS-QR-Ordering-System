import { ReservationStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { TableRepository } from "../../tables/repositories/table.repository.js";
import { ReservationRepository } from "../repositories/reservation.repository.js";
import { CreateReservationUseCase } from "../use-cases/create-reservation.use-case.js";
import {
  ReservationConflictError,
  ReservationInPastError,
  ReservationTableDisabledError,
  ReservationTableNotFoundError,
} from "../use-cases/reservation-errors.js";
import { buildReservation, buildTable } from "./reservation.fixture.js";

function setup() {
  const reservationRepository = {
    findById: vi.fn(),
    findByDate: vi.fn(),
    findActiveByTable: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  } as unknown as ReservationRepository;
  const tableRepository = {
    findById: vi.fn(),
  } as unknown as TableRepository;
  const useCase = new CreateReservationUseCase(
    reservationRepository,
    tableRepository,
  );
  return { reservationRepository, tableRepository, useCase };
}

const validInput = {
  customerName: "Ahmed Samy",
  phone: "01012345678",
  partySize: 4,
  tableId: "table_1",
  reservedFor: new Date("2030-01-15T19:00:00.000Z"),
};

describe("CreateReservationUseCase", () => {
  it("creates a reservation for a future time", async () => {
    const { reservationRepository, tableRepository, useCase } = setup();

    vi.mocked(tableRepository.findById).mockResolvedValueOnce(
      buildTable() as never,
    );
    vi.mocked(reservationRepository.findActiveByTable).mockResolvedValueOnce(
      [],
    );
    vi.mocked(reservationRepository.create).mockResolvedValueOnce(
      buildReservation() as never,
    );

    const result = await useCase.execute(validInput);

    expect(reservationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: "Ahmed Samy", partySize: 4 }),
    );
    expect(result).toMatchObject({ id: "res_1" });
  });

  it("rejects past reservation times", async () => {
    const { reservationRepository, useCase } = setup();

    await expect(
      useCase.execute({
        ...validInput,
        reservedFor: new Date("2020-01-01T19:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(ReservationInPastError);
    expect(reservationRepository.create).not.toHaveBeenCalled();
  });

  it("rejects missing and disabled tables", async () => {
    const { tableRepository, useCase } = setup();

    vi.mocked(tableRepository.findById).mockResolvedValueOnce(null as never);
    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      ReservationTableNotFoundError,
    );

    vi.mocked(tableRepository.findById).mockResolvedValueOnce(
      buildTable({ status: "DISABLED" }) as never,
    );
    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      ReservationTableDisabledError,
    );
  });

  it("rejects overlapping bookings on the same table", async () => {
    const { reservationRepository, tableRepository, useCase } = setup();

    vi.mocked(tableRepository.findById).mockResolvedValue(buildTable() as never);
    vi.mocked(reservationRepository.findActiveByTable).mockResolvedValue([
      buildReservation({
        id: "res_other",
        reservedFor: new Date("2030-01-15T20:00:00.000Z"),
        status: ReservationStatus.CONFIRMED,
      }),
    ] as never);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      ReservationConflictError,
    );
    expect(reservationRepository.create).not.toHaveBeenCalled();
  });

  it("allows bookings outside the slot window", async () => {
    const { reservationRepository, tableRepository, useCase } = setup();

    vi.mocked(tableRepository.findById).mockResolvedValue(buildTable() as never);
    vi.mocked(reservationRepository.findActiveByTable).mockResolvedValue([
      buildReservation({
        id: "res_other",
        reservedFor: new Date("2030-01-15T22:30:00.000Z"),
      }),
    ] as never);
    vi.mocked(reservationRepository.create).mockResolvedValueOnce(
      buildReservation() as never,
    );

    await expect(useCase.execute(validInput)).resolves.toMatchObject({
      id: "res_1",
    });
  });
});
