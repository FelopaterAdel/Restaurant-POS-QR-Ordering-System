import { useQuery } from "@tanstack/react-query";
import { listReservations } from "./reservations.api";
import type { ReservationStatus } from "./reservations.types";

export const reservationKeys = {
  all: ["reservations"] as const,
  lists: () => [...reservationKeys.all, "list"] as const,
  list: (date?: string, status?: ReservationStatus) =>
    [...reservationKeys.lists(), date, status] as const,
};

export function useReservationsQuery(date?: string, status?: ReservationStatus) {
  return useQuery({
    queryKey: reservationKeys.list(date, status),
    queryFn: () => listReservations(date, status),
  });
}
