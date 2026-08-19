import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTable, disableTable, updateTable } from "./tables.api";
import { tableKeys } from "./tables.queries";
import type { CreateTableInput, UpdateTableInput } from "./tables.types";

export function useCreateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTableInput) => createTable(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableInput }) =>
      updateTable(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}

export function useDisableTableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tableId: string) => disableTable(tableId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tableKeys.all });
    },
  });
}
