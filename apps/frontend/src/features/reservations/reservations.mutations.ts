import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelReservation,
  createReservation,
  updateReservation,
  updateReservationStatus,
} from "./reservations.api";
import { reservationKeys } from "./reservations.queries";
import type {
  CreateReservationInput,
  ReservationStatus,
  UpdateReservationInput,
} from "./reservations.types";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: reservationKeys.all });
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservationInput }) =>
      updateReservation(id, data),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateReservationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => cancelReservation(reservationId),
    onSuccess: () => invalidateAll(queryClient),
  });
}
