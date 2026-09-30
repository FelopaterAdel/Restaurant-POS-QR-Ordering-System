import { ReservationStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { ReservationRepository } from "../repositories/reservation.repository.js";
import { ReservationInvalidStatusError } from "../use-cases/reservation-errors.js";
import { UpdateReservationStatusUseCase } from "../use-cases/update-reservation-status.use-case.js";
import { buildReservation } from "./reservation.fixture.js";

function setup() {
  const reservationRepository = {
    findById: vi.fn(),
    updateStatus: vi.fn(),
  } as unknown as ReservationRepository;
  const useCase = new UpdateReservationStatusUseCase(reservationRepository);
  return { reservationRepository, useCase };
}

describe("UpdateReservationStatusUseCase", () => {
  it("walks PENDING → CONFIRMED → SEATED → COMPLETED", async () => {
    const { reservationRepository, useCase } = setup();

    for (const [from, to] of [
      [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
      [ReservationStatus.CONFIRMED, ReservationStatus.SEATED],
      [ReservationStatus.SEATED, ReservationStatus.COMPLETED],
    ] as const) {
      vi.mocked(reservationRepository.findById).mockResolvedValueOnce(
        buildReservation({ status: from }) as never,
      );
      vi.mocked(reservationRepository.updateStatus).mockResolvedValueOnce(
        buildReservation({ status: to }) as never,
      );

      const result = await useCase.execute("res_1", { status: to });
      expect(result).toMatchObject({ status: to });
    }
    expect(reservationRepository.updateStatus).toHaveBeenCalledTimes(3);
  });

  it("rejects invalid transitions", async () => {
    const { reservationRepository, useCase } = setup();

    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(
      buildReservation({ status: ReservationStatus.PENDING }) as never,
    );

    await expect(
      useCase.execute("res_1", { status: ReservationStatus.SEATED }),
    ).rejects.toBeInstanceOf(ReservationInvalidStatusError);
    expect(reservationRepository.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects transitions from terminal states", async () => {
    const { reservationRepository, useCase } = setup();

    vi.mocked(reservationRepository.findById).mockResolvedValueOnce(
      buildReservation({ status: ReservationStatus.CANCELLED }) as never,
    );

    await expect(
      useCase.execute("res_1", { status: ReservationStatus.CONFIRMED }),
    ).rejects.toBeInstanceOf(ReservationInvalidStatusError);
  });
});
