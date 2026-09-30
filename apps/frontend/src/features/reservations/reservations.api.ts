import { api } from "@/lib/api";
import type {
  CreateReservationInput,
  Reservation,
  ReservationStatus,
  UpdateReservationInput,
} from "./reservations.types";

export async function listReservations(
  date?: string,
  status?: ReservationStatus,
): Promise<Reservation[]> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (status) params.status = status;
  return api.get<Reservation[]>("/reservations", { params });
}

export async function getReservation(
  reservationId: string,
): Promise<Reservation> {
  return api.get<Reservation>(`/reservations/${reservationId}`);
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  return api.post<Reservation>("/reservations", input);
}

export async function updateReservation(
  reservationId: string,
  input: UpdateReservationInput,
): Promise<Reservation> {
  return api.patch<Reservation>(`/reservations/${reservationId}`, input);
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
): Promise<Reservation> {
  return api.patch<Reservation>(`/reservations/${reservationId}/status`, {
    status,
  });
}

export async function cancelReservation(
  reservationId: string,
): Promise<Reservation> {
  return api.delete<Reservation>(`/reservations/${reservationId}`);
}
