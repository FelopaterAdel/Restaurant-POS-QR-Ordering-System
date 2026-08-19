import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTable, disableTable, updateTable } from "./tables.api";
import { tableKeys } from "./tables.queries";
import type { UpdateTableInput } from "./tables.types";

export function useCreateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useUpdateTableMutation(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTableInput) => updateTable(tableId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useDisableTableMutation(tableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => disableTable(tableId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}
