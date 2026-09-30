import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../http/response.js";
import type { AuthenticatedRequest } from "../../../types/authenticated-request.js";
import { CancelReservationUseCase } from "../use-cases/cancel-reservation.use-case.js";
import { CreateReservationUseCase } from "../use-cases/create-reservation.use-case.js";
import { GetReservationUseCase } from "../use-cases/get-reservation.use-case.js";
import { ListReservationsUseCase } from "../use-cases/list-reservations.use-case.js";
import { UpdateReservationStatusUseCase } from "../use-cases/update-reservation-status.use-case.js";
import { UpdateReservationUseCase } from "../use-cases/update-reservation.use-case.js";

const createReservationUseCase = new CreateReservationUseCase();
const listReservationsUseCase = new ListReservationsUseCase();
const getReservationUseCase = new GetReservationUseCase();
const updateReservationUseCase = new UpdateReservationUseCase();
const updateStatusUseCase = new UpdateReservationStatusUseCase();
const cancelReservationUseCase = new CancelReservationUseCase();

export async function createReservation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const reservation = await createReservationUseCase.execute(req.body);
  sendSuccess(res, reservation, 201);
}

export async function listReservations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const { date, status } = req.query as {
    date?: string;
    status?: "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED" | "COMPLETED";
  };
  const reservations = await listReservationsUseCase.execute({
    date,
    status: status as never,
  });
  sendSuccess(res, reservations);
}

export async function getReservation(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const reservation = await getReservationUseCase.execute(req.params.id);
  sendSuccess(res, reservation);
}

export async function updateReservation(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const reservation = await updateReservationUseCase.execute(
    req.params.id,
    req.body,
  );
  sendSuccess(res, reservation);
}

export async function updateReservationStatus(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const reservation = await updateStatusUseCase.execute(
    req.params.id,
    req.body,
  );
  sendSuccess(res, reservation);
}

export async function cancelReservation(
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const reservation = await cancelReservationUseCase.execute(req.params.id);
  sendSuccess(res, reservation);
}
