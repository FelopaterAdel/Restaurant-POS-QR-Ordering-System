import { useQuery } from "@tanstack/react-query";
import { getTable, listTables } from "./tables.api";

export const tableKeys = {
  all: ["tables"] as const,
  lists: () => [...tableKeys.all, "list"] as const,
  list: () => [...tableKeys.lists()] as const,
  details: () => [...tableKeys.all, "detail"] as const,
  detail: (tableId: string) => [...tableKeys.details(), tableId] as const,
};

export function useTablesQuery() {
  return useQuery({
    queryKey: tableKeys.list(),
    queryFn: listTables,
  });
}

export function useTableDetailQuery(tableId: string) {
  return useQuery({
    queryKey: tableKeys.detail(tableId),
    queryFn: () => getTable(tableId),
    enabled: tableId.length > 0,
  });
}
