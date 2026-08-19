import { api } from "@/lib/api";
import type { CreateTableInput, Table, UpdateTableInput } from "./tables.types";

export async function listTables(): Promise<Table[]> {
  return api.get<Table[]>("/tables");
}

export async function getTable(tableId: string): Promise<Table> {
  return api.get<Table>(`/tables/${tableId}`);
}

export async function createTable(input: CreateTableInput): Promise<Table> {
  return api.post<Table>("/tables", input);
}

export async function updateTable(
  tableId: string,
  input: UpdateTableInput,
): Promise<Table> {
  return api.patch<Table>(`/tables/${tableId}`, input);
}

export async function disableTable(tableId: string): Promise<Table> {
  return api.delete<Table>(`/tables/${tableId}`);
}
