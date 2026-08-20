import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaff, updateStaffProfile, updateStaffStatus } from "./users.api";
import { staffKeys } from "./users.queries";
import type { CreateStaffInput, UpdateStaffInput, StaffStatus } from "./users.types";

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useUpdateStaffProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      input,
    }: {
      staffId: string;
      input: UpdateStaffInput;
    }) => updateStaffProfile(staffId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useUpdateStaffStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      staffId,
      status,
    }: {
      staffId: string;
      status: StaffStatus;
    }) => updateStaffStatus(staffId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
