import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaff } from "./users.api";
import { staffKeys } from "./users.queries";
import type { CreateStaffInput } from "./users.types";

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
